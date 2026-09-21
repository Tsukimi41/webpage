import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const componentUrl = new URL('../src/components/SkillShowcase.astro', import.meta.url);
const globalStylesUrl = new URL('../src/styles/global.css', import.meta.url);

const marbleTokens = [
	'--color-marble-highlight',
	'--color-marble-core',
	'--color-marble-mid',
	'--color-marble-edge',
	'--color-marble-vein',
	'--color-marble-rim',
	'--color-marble-symbol',
	'--color-marble-shadow',
	'--color-marble-glow',
];

const hexToLuminance = (hex) => {
	const channels = hex
		.slice(1)
		.match(/.{2}/g)
		.map((channel) => Number.parseInt(channel, 16) / 255)
		.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);

	return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrastRatio = (first, second) => {
	const firstLuminance = hexToLuminance(first);
	const secondLuminance = hexToLuminance(second);

	return (Math.max(firstLuminance, secondLuminance) + 0.05) /
		(Math.min(firstLuminance, secondLuminance) + 0.05);
};

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

test('marbles use a distinct, complete material palette for every theme', async () => {
	const [component, globalStyles] = await Promise.all([
		readFile(componentUrl, 'utf8'),
		readFile(globalStylesUrl, 'utf8'),
	]);
	const themeBlocks = [
		globalStyles.match(/:root,\s*:root\[data-theme='dark-green'\] \{([\s\S]*?)\n\}/)?.[1],
		globalStyles.match(/:root\[data-theme='light-blue'\] \{([\s\S]*?)\n\}/)?.[1],
		globalStyles.match(/:root\[data-theme='dark-blue'\] \{([\s\S]*?)\n\}/)?.[1],
	];

	for (const [themeIndex, block] of themeBlocks.entries()) {
		assert.ok(block, `theme ${themeIndex + 1} must exist`);
		for (const token of marbleTokens) {
			assert.match(block, new RegExp(`${token}:\\s*[^;]+;`));
		}
	}

	for (const token of ['--color-marble-core', '--color-marble-mid', '--color-marble-edge']) {
		const values = themeBlocks.map((block) => block?.match(new RegExp(`${token}:\\s*([^;]+);`))?.[1]);
		assert.equal(new Set(values).size, 3, `${token} must differ across all themes`);
	}

	for (const [themeIndex, block] of themeBlocks.entries()) {
		const readHexToken = (token) => block?.match(new RegExp(`${token}:\\s*(#[0-9a-f]{6});`, 'i'))?.[1] ?? '';
		const symbol = readHexToken('--color-marble-symbol');
		const core = readHexToken('--color-marble-core');
		const middle = readHexToken('--color-marble-mid');

		assert.ok(contrastRatio(symbol, core) >= 7, `theme ${themeIndex + 1} core contrast must be at least 7:1`);
		assert.ok(contrastRatio(symbol, middle) >= 4.5, `theme ${themeIndex + 1} mid contrast must be at least 4.5:1`);
	}

	const marbleSurface = component.match(
		/\.skill-object--marble \.skill-object__surface \{([\s\S]*?)\n\t\}/,
	)?.[1] ?? '';
	assert.match(marbleSurface, /conic-gradient/);
	assert.match(marbleSurface, /var\(--color-marble-core\)/);
	assert.match(marbleSurface, /var\(--color-marble-mid\)/);
	assert.match(marbleSurface, /var\(--color-marble-edge\)/);
	assert.match(component, /\.skill-object--marble \.skill-object__symbol \{[\s\S]*?var\(--color-marble-symbol\)/);
	assert.match(component, /background: var\(--color-marble-shadow\)/);
	assert.doesNotMatch(marbleSurface, /var\(--color-(?:accent|accent-strong|surface-raised)\)|\bwhite\b|rgb\(/);
});
