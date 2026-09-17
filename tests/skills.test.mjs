import assert from 'node:assert/strict';
import test from 'node:test';

import { projects } from '../src/content/projects/index.ts';
import {
	defineSkillCollection,
	findSkillById,
	getSkills,
	selectProjectsForSkill,
	selectSkills,
	skills,
} from '../src/content/skills/index.ts';

const validSkill = Object.freeze({
	id: 'test-skill',
	state: 'mock',
	order: 0,
	label: 'Test Skill',
	category: 'tool',
	summary: 'Test summary.',
	presentation: 'bubble',
	visual: { kind: 'text', text: 'TS' },
});

test('skill data is frozen and returned in deterministic order', () => {
	assert.equal(Object.isFrozen(skills), true);
	assert.equal(skills.every(Object.isFrozen), true);
	assert.equal(skills.every((skill) => Object.isFrozen(skill.visual)), true);
	assert.deepEqual(
		getSkills().map((skill) => skill.id),
		['typescript', 'astro', 'css', 'markdown', 'github-actions'],
	);
	assert.equal(Object.isFrozen(getSkills()), true);
});

test('skill queries support state filtering, limits, and id lookup', () => {
	const records = defineSkillCollection([
		validSkill,
		{
			...validSkill,
			id: 'published-skill',
			state: 'published',
			order: 1,
			label: 'Published Skill',
		},
	]);

	assert.deepEqual(selectSkills(records, { limit: 1 }).map((skill) => skill.id), ['test-skill']);
	assert.deepEqual(selectSkills(records, { limit: 0 }), []);
	assert.deepEqual(
		selectSkills(records, { states: ['published'] }).map((skill) => skill.id),
		['published-skill'],
	);
	assert.equal(findSkillById(records, 'published-skill')?.label, 'Published Skill');
	assert.equal(findSkillById(records, 'missing-skill'), undefined);
});

test('skill queries reject malformed ids and limits', () => {
	for (const id of ['', 'TypeScript', '../typescript']) {
		assert.throws(() => findSkillById(skills, id), /skill query id/);
	}

	for (const limit of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
		assert.throws(() => getSkills({ limit }), /non-negative safe integer/);
	}
});

test('skill validation rejects empty, duplicate, and unsupported values', () => {
	const invalidSkills = [
		{ ...validSkill, label: ' ' },
		{ ...validSkill, summary: '' },
		{ ...validSkill, category: 'database' },
		{ ...validSkill, presentation: 'cloud' },
		{ ...validSkill, visual: { kind: 'icon', name: 'invalid icon' } },
		{ ...validSkill, visual: { kind: 'text', text: ' ' } },
		{
			...validSkill,
			visual: { kind: 'image', src: '/icons/test.svg', alt: 'Test', width: 0, height: 32 },
		},
		{
			...validSkill,
			visual: {
				kind: 'image',
				src: 'http://example.com/icon.svg',
				alt: 'Test',
				width: 32,
				height: 32,
			},
		},
		{
			...validSkill,
			visual: {
				kind: 'image',
				src: '/icons/test.svg',
				alt: 'Test',
				width: 32,
				height: 32,
				sourceName: 'Icon source',
			},
		},
	];

	for (const skill of invalidSkills) {
		assert.throws(() => defineSkillCollection([skill]));
	}

	assert.throws(() =>
		defineSkillCollection([
			validSkill,
			{ ...validSkill, id: 'other-skill', label: ' test skill ' },
		]),
	);
});

test('skill visuals accept icon, image, and text sources', () => {
	const records = defineSkillCollection([
		{ ...validSkill, id: 'icon-skill', label: 'Icon', visual: { kind: 'icon', name: 'simple-icons:typescript' } },
		{
			...validSkill,
			id: 'image-skill',
			label: 'Image',
			visual: {
				kind: 'image',
				src: '/icons/custom.webp',
				alt: 'Custom tool icon',
				width: 96,
				height: 96,
				sourceName: 'Example Icons',
				sourceUrl: 'https://example.com/icons',
				license: 'Example free license',
			},
		},
		{ ...validSkill, id: 'text-skill', label: 'Text', visual: { kind: 'text', text: 'TXT' } },
	]);

	assert.deepEqual(records.map((skill) => skill.visual.kind), ['icon', 'image', 'text']);
	assert.equal(records[1].visual.sourceUrl, 'https://example.com/icons');
});

test('project evidence is resolved from skill ids without duplicating relationships', () => {
	assert.deepEqual(
		selectProjectsForSkill(projects, 'markdown').map((project) => project.id),
		['mock-campus-guide'],
	);
	assert.deepEqual(
		selectProjectsForSkill(projects, 'typescript').map((project) => project.id),
		['mock-learning-log', 'mock-campus-guide', 'mock-command-notes'],
	);
	assert.equal(Object.isFrozen(selectProjectsForSkill(projects, 'css')), true);
});
