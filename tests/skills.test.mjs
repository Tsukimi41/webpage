import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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
	scale: 'medium',
	visual: { kind: 'text', text: 'TS' },
});

test('skill data is frozen and returned in deterministic order', () => {
	assert.equal(Object.isFrozen(skills), true);
	assert.equal(skills.every(Object.isFrozen), true);
	assert.equal(skills.every((skill) => Object.isFrozen(skill.visual)), true);
	assert.deepEqual(
		getSkills().map((skill) => skill.id),
		[
			'ros-2',
			'arch-linux',
			'github',
			'python',
			'node-js',
			'c',
			'cpp',
			'aruco-marker',
			'docker',
			'latex',
			'vite',
			'typescript',
			'html',
			'css',
			'opencv',
			'mixamo',
			'wsl-2',
			'amt-viewpoint',
			'voicevox',
			'ubuntu',
			'xampp-control-panel',
			'solidworks',
			'matlab',
			'raspberry-pi-pico-2-w',
			'godot',
			'lapis-lexide',
			'vroid-studio-2-8-0',
			'n1mm-logger-plus',
			'astro',
			'markdown',
			'github-actions',
			'vercel',
		],
	);
	assert.equal(skills.length, 32);
	assert.equal(skills.every((skill) => skill.state === 'published'), true);
	assert.deepEqual(new Set(skills.map((skill) => skill.scale)), new Set(['small', 'medium', 'large']));
	assert.deepEqual(new Set(skills.map((skill) => skill.presentation)), new Set(['bubble', 'marble']));
	assert.deepEqual(
		Object.fromEntries(['large', 'medium', 'small'].map((scale) => [
			scale,
			skills.filter((skill) => skill.scale === scale).map((skill) => skill.id),
		])),
		{
			large: [
				'ros-2', 'arch-linux', 'github', 'python', 'node-js', 'c', 'cpp', 'docker',
				'latex', 'typescript', 'opencv', 'ubuntu', 'raspberry-pi-pico-2-w',
			],
			medium: [
				'aruco-marker', 'vite', 'html', 'css', 'mixamo', 'wsl-2', 'voicevox',
				'vroid-studio-2-8-0', 'astro', 'markdown', 'github-actions', 'vercel',
			],
			small: [
				'amt-viewpoint', 'xampp-control-panel', 'solidworks', 'matlab', 'godot',
				'lapis-lexide', 'n1mm-logger-plus',
			],
		},
	);
	assert.deepEqual(
		Object.fromEntries(['marble', 'bubble'].map((presentation) => [
			presentation,
			skills.filter((skill) => skill.presentation === presentation).map((skill) => skill.id),
		])),
		{
			marble: [
				'ros-2', 'arch-linux', 'github', 'python', 'node-js', 'c', 'cpp',
				'aruco-marker', 'docker', 'opencv', 'wsl-2', 'amt-viewpoint', 'ubuntu',
				'xampp-control-panel', 'solidworks', 'matlab', 'raspberry-pi-pico-2-w',
				'lapis-lexide', 'n1mm-logger-plus', 'github-actions',
			],
			bubble: [
				'latex', 'vite', 'typescript', 'html', 'css', 'mixamo', 'voicevox', 'godot',
				'vroid-studio-2-8-0', 'astro', 'markdown', 'vercel',
			],
		},
	);
	assert.equal(skills.every((skill) => skill.visual.kind === 'image'), true);
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
		{ ...validSkill, scale: 'giant' },
		{ ...validSkill, visual: { kind: 'icon', name: 'invalid icon' } },
		{ ...validSkill, visual: { kind: 'text', text: ' ' } },
		{
			...validSkill,
			visual: { kind: 'image', src: '/icons/test.svg', alt: 'Test', width: 0, height: 32 },
		},
		{
			...validSkill,
			visual: { kind: 'image', src: '/icons/test.svg', alt: 'Test', width: 8_193, height: 32 },
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
				src: 'https://cdn.example.com/icon.svg',
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
		{ ...validSkill, visual: { kind: 'text', text: '1234567890123456789012345' } },
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
				src: 'https://cdn.example.com/icons/custom.webp',
				alt: 'Custom tool icon',
				width: 96,
				height: 96,
				sourceName: 'Example Icons',
				sourceUrl: 'https://example.com/icons',
				license: 'Example free license',
				fallbackText: 'IMG',
			},
		},
		{ ...validSkill, id: 'text-skill', label: 'Text', visual: { kind: 'text', text: 'TXT' } },
	]);

	assert.deepEqual(records.map((skill) => skill.visual.kind), ['icon', 'image', 'text']);
	assert.equal(records[1].visual.sourceUrl, 'https://example.com/icons');
	assert.equal(records[1].visual.fallbackText, 'IMG');
	assert.equal(records[2].visual.fallbackText, 'TXT');
});

test('every configured skill uses a concrete local image without a fallback', async () => {
	for (const skill of skills) {
		assert.equal(skill.visual.kind, 'image');
		assert.match(skill.visual.src, /^\/icons\/skills\/[a-z0-9-]+\.(?:svg|png)$/);
		assert.equal('fallbackText' in skill.visual, false);

		const assetUrl = new URL(`../public${skill.visual.src}`, import.meta.url);
		const asset = await readFile(assetUrl);
		assert.ok(asset.byteLength > 0);

		if (skill.visual.src.endsWith('.svg')) {
			const svg = asset.toString('utf8');
			assert.match(svg, /<svg\b/);
			assert.doesNotMatch(svg, /<script\b|javascript:/i);
			assert.doesNotMatch(svg, /currentColor/);
		} else {
			assert.deepEqual([...asset.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
		}
	}

	assert.deepEqual(
		Object.fromEntries(
			['mixamo', 'voicevox', 'wsl-2', 'xampp-control-panel'].map((id) => {
				const skill = skills.find((candidate) => candidate.id === id);
				return [id, skill?.visual.kind === 'image' ? skill.visual.src : undefined];
			}),
		),
		{
			mixamo: '/icons/skills/mixamo.svg',
			voicevox: '/icons/skills/voicevox.png',
			'wsl-2': '/icons/skills/wsl-2.png',
			'xampp-control-panel': '/icons/skills/xampp-control-panel.svg',
		},
	);

	const rosIcon = await readFile(new URL('../public/icons/skills/ros-2.svg', import.meta.url), 'utf8');
	const pythonIcon = await readFile(new URL('../public/icons/skills/python.svg', import.meta.url), 'utf8');
	assert.match(rosIcon, /viewBox="0 0 24 24"/);
	assert.match(pythonIcon, /viewBox="0 0 128 128"/);
	assert.doesNotMatch(rosIcon, /<rect[^>]+fill="#f8fafc"/);
	assert.doesNotMatch(pythonIcon, /<rect[^>]+fill="#f8fafc"/);
});

test('project evidence is resolved from skill ids without duplicating relationships', () => {
	assert.deepEqual(
		selectProjectsForSkill(projects, 'markdown').map((project) => project.id),
		['personal-web-development'],
	);
	assert.deepEqual(
		selectProjectsForSkill(projects, 'typescript').map((project) => project.id),
		[
			'team411-upoc',
			'voice-comic-hackathon',
			'personal-web-development',
			'meguru-route-optimization',
			'smart-beekeeping',
		],
	);
	assert.equal(Object.isFrozen(selectProjectsForSkill(projects, 'css')), true);
});
