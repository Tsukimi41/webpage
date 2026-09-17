import assert from 'node:assert/strict';
import test from 'node:test';

import {
	defineProjectCollection,
	findProjectBySlug,
	getFeaturedProjects,
	getProjectBySlug,
	getProjects,
	projects,
	selectFeaturedProjects,
	selectProjects,
} from '../src/content/projects/index.ts';

const validProject = Object.freeze({
	id: 'test-project',
	state: 'mock',
	order: 0,
	slug: 'test-project',
	title: 'Test project',
	summary: 'Test summary',
	period: '20XX',
	role: 'Test role',
	technologyLabels: ['TypeScript'],
	featured: true,
	links: [],
	detailSections: [
		{
			id: 'overview',
			title: 'Overview',
			paragraphs: ['Test detail.'],
		},
	],
});

test('project data is deeply frozen at its collection boundaries', () => {
	assert.equal(Object.isFrozen(projects), true);

	for (const project of projects) {
		assert.equal(Object.isFrozen(project), true);
		assert.equal(Object.isFrozen(project.technologyLabels), true);
		assert.equal(Object.isFrozen(project.links), true);
		assert.equal(project.links.every(Object.isFrozen), true);
		assert.equal(Object.isFrozen(project.detailSections), true);
		assert.equal(project.detailSections.every(Object.isFrozen), true);
		assert.equal(project.detailSections.every((section) => Object.isFrozen(section.paragraphs)), true);
	}
});

test('featured query filters and orders projects before applying its limit', () => {
	assert.deepEqual(
		getFeaturedProjects().map((project) => project.id),
		['mock-learning-log', 'mock-campus-guide'],
	);
	assert.deepEqual(
		getFeaturedProjects({ limit: 1 }).map((project) => project.id),
		['mock-learning-log'],
	);
	assert.deepEqual(getFeaturedProjects({ limit: 0 }), []);
});

test('project query returns featured and non-featured records in deterministic order', () => {
	const selectedProjects = getProjects();

	assert.deepEqual(
		selectedProjects.map((project) => project.id),
		['mock-learning-log', 'mock-campus-guide', 'mock-command-notes'],
	);
	assert.equal(Object.isFrozen(selectedProjects), true);
	assert.deepEqual(
		getProjects({ limit: 2 }).map((project) => project.id),
		['mock-learning-log', 'mock-campus-guide'],
	);
	assert.deepEqual(getProjects({ limit: 0 }), []);
});

test('featured query can select an explicit set of content states', () => {
	const records = defineProjectCollection([
		validProject,
		{ ...validProject, id: 'published-project', slug: 'published-project', state: 'published' },
	]);

	assert.deepEqual(
		selectFeaturedProjects(records, { states: ['published'] }).map((project) => project.id),
		['published-project'],
	);
	assert.deepEqual(
		selectProjects(records, { states: ['mock'] }).map((project) => project.id),
		['test-project'],
	);
});

test('project slug query respects content state visibility', () => {
	const records = defineProjectCollection([
		validProject,
		{ ...validProject, id: 'archived-project', slug: 'archived-project', state: 'archived' },
	]);

	assert.equal(findProjectBySlug(records, 'test-project')?.id, 'test-project');
	assert.equal(findProjectBySlug(records, 'missing-project'), undefined);
	assert.equal(findProjectBySlug(records, 'archived-project'), undefined);
	assert.equal(
		findProjectBySlug(records, 'archived-project', { states: ['archived'] })?.id,
		'archived-project',
	);
	assert.equal(getProjectBySlug('learning-log')?.id, 'mock-learning-log');
});

test('project slug query rejects malformed slugs', () => {
	for (const slug of ['', ' learning-log', 'Learning Log', '../learning-log']) {
		assert.throws(() => findProjectBySlug([validProject], slug), /project query slug/);
	}
});

test('featured query rejects invalid limits', () => {
	for (const limit of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
		assert.throws(() => getFeaturedProjects({ limit }), /non-negative safe integer/);
		assert.throws(() => getProjects({ limit }), /non-negative safe integer/);
	}
});

test('project validation rejects malformed nested data', () => {
	const invalidProjects = [
		{ ...validProject, title: ' ' },
		{ ...validProject, technologyLabels: [] },
		{ ...validProject, technologyLabels: ['CSS', ' CSS '] },
		{
			...validProject,
			links: [{ id: 'demo', label: 'Demo', href: 'http://example.com' }],
		},
		{
			...validProject,
			links: [{ id: 'demo', label: 'Demo', href: 'https://user:pass@example.com' }],
		},
		{ ...validProject, detailSections: [] },
		{
			...validProject,
			detailSections: [
				{ id: 'overview', title: 'Overview', paragraphs: ['First'] },
				{ id: 'overview', title: 'Duplicate', paragraphs: ['Second'] },
			],
		},
		{
			...validProject,
			detailSections: [{ id: 'overview', title: 'Overview', paragraphs: [' '] }],
		},
	];

	for (const project of invalidProjects) {
		assert.throws(() => defineProjectCollection([project]));
	}
});
