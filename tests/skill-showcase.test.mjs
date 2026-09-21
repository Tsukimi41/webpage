import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const componentUrl = new URL('../src/components/SkillShowcase.astro', import.meta.url);

test('skill showcase keeps ambient and skill bubbles as separate physics roles', async () => {
	const source = await readFile(componentUrl, 'utf8');

	assert.match(source, /Array\.from\(\{ length: 6 \}/);
	assert.match(source, /data-physics-role="ambient"/);
	assert.match(source, /data-physics-role="skill"/);
	assert.match(source, /\.ambient-bubble\.is-bursting/);
});
