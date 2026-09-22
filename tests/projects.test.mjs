import assert from 'node:assert/strict';
import test from 'node:test';

import {
	assertProjectSkillReferences,
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
	skillIds: ['typescript'],
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
		assert.equal(Object.isFrozen(project.skillIds), true);
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
		[
			'robomech-f3rc',
			'yorumot',
			'team411-upoc',
			'voice-comic-hackathon',
			'personal-web-development',
			'meguru-route-optimization',
			'miaou-robot',
			'drone-programming',
			'uec-osint-club',
			'smart-beekeeping',
			'toward-space',
		],
	);
	assert.deepEqual(
		getFeaturedProjects({ limit: 1 }).map((project) => project.id),
		['robomech-f3rc'],
	);
	assert.deepEqual(getFeaturedProjects({ limit: 0 }), []);
});

test('project query returns featured and non-featured records in deterministic order', () => {
	const selectedProjects = getProjects();

	assert.deepEqual(
		selectedProjects.map((project) => project.id),
		[
			'scratch-first-programming',
			'international-life',
			'ultimate-fruit-catch',
			'debate-and-model-un',
			'robomech-f3rc',
			'yorumot',
			'embedded-system-practice',
			'team411-upoc',
			'voice-comic-hackathon',
			'personal-web-development',
			'meguru-route-optimization',
			'miaou-robot',
			'drone-programming',
			'data-science-optimization',
			'uec-osint-club',
			'smart-beekeeping',
			'amateur-radio',
			'tourism-crossover-contest',
			'toward-space',
		],
	);
	assert.equal(Object.isFrozen(selectedProjects), true);
	assert.deepEqual(
		getProjects({ limit: 2 }).map((project) => project.id),
		['scratch-first-programming', 'international-life'],
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
	assert.equal(getProjectBySlug('meguru-route-optimization')?.id, 'meguru-route-optimization');
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
		{ ...validProject, skillIds: ['css', 'css'] },
		{ ...validProject, skillIds: ['Type Script'] },
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

test('project skill references reject missing evidence and unsafe public project references', () => {
	const mockSkill = { id: 'typescript', state: 'mock' };
	const publishedSkill = { id: 'typescript', state: 'published' };

	assert.doesNotThrow(() => assertProjectSkillReferences([validProject], [mockSkill]));
	assert.throws(
		() => assertProjectSkillReferences([validProject], [{ id: 'css', state: 'mock' }]),
		/unknown skill/,
	);
	assert.throws(
		() => assertProjectSkillReferences([validProject], [mockSkill, { id: 'css', state: 'mock' }]),
		/no supporting project/,
	);
	assert.throws(
		() =>
			assertProjectSkillReferences(
				[{ ...validProject, state: 'published' }],
				[mockSkill],
			),
		/non-published skill/,
	);
	assert.doesNotThrow(() => assertProjectSkillReferences([validProject], [publishedSkill]));
});

test('timeline milestones may omit skill labels', () => {
	const [project] = defineProjectCollection([{ ...validProject, skillIds: [] }]);
	assert.deepEqual(project.skillIds, []);
	assert.equal(Object.isFrozen(project.skillIds), true);
});
