import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const componentUrl = new URL('../src/components/SkillShowcase.astro', import.meta.url);

test('skill showcase keeps ambient and skill bubbles as separate physics roles', async () => {
	const source = await readFile(componentUrl, 'utf8');

	assert.match(source, /Array\.from\(\{ length: 6 \}/);
	assert.match(source, /data-physics-role="ambient"/);
	assert.match(source, /data-physics-role="skill"/);
	assert.match(source, /data-burst-state="idle"/);
	assert.match(source, /\.ambient-bubble\[data-burst-state='bursting'\]/);
	assert.match(source, /\.ambient-bubble\[data-burst-variant='1'\]/);
	assert.match(source, /\.ambient-bubble\[data-burst-variant='2'\]/);
	assert.match(source, /\.ambient-bubble\[data-burst-variant='3'\]/);
	assert.match(source, /\.skill-object--bubble\s*\{[^}]*--deform-x:\s*1;/s);
	assert.match(source, /--deform-radius:\s*50%/);
	assert.match(
		source,
		/\.skill-object--bubble \.skill-object__surface\s*\{[^}]*border-radius:\s*var\(--deform-radius\)/s,
	);
	assert.doesNotMatch(
		source,
		/\.skill-object--bubble \.skill-object__surface\s*\{[^}]*--deform-x:/s,
	);
});
