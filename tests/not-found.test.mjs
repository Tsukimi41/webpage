import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const baseLayoutUrl = new URL('../src/layouts/BaseLayout.astro', import.meta.url);
const notFoundUrl = new URL('../src/pages/404.astro', import.meta.url);

test('base layout uses one indexing contract for robots and URL metadata', async () => {
	const source = await readFile(baseLayoutUrl, 'utf8');

	assert.match(source, /indexing\?: 'auto' \| 'disabled'/);
	assert.match(source, /indexing = 'auto'/);
	assert.match(source, /const isIndexable = indexing === 'auto' && siteUrl\.isPublic/);
	assert.match(source, /indexing === 'auto' && <link rel="canonical"/);
	assert.match(source, /indexing === 'auto' && <meta property="og:url"/);
});

test('404 page is explicitly non-indexable and never reflects the missing URL', async () => {
	const source = await readFile(notFoundUrl, 'utf8');

	assert.match(source, /<BaseLayout[\s\S]*indexing="disabled"/);
	assert.match(source, /<SectionHeading id="not-found-title" label="ページが見つかりません" level="h1" \/>/);
	assert.doesNotMatch(source, /Astro\.(?:url|originPathname)|searchParams|window\.location/);
	assert.doesNotMatch(source, /<script/);
});

test('404 page offers bounded article search and all primary recovery links', async () => {
	const source = await readFile(notFoundUrl, 'utf8');

	assert.match(source, /action="\/articles\/" method="get" role="search"/);
	assert.match(source, /name="q"[\s\S]*type="search"[\s\S]*maxlength="80"/);
	assert.match(source, /aria-label="主要ページへ移動"/);

	for (const path of ['/', '/projects/', '/articles/', '/profile/']) {
		assert.match(source, new RegExp(`href: '${path.replaceAll('/', '\\/')}'`));
	}
	assert.doesNotMatch(source, /href: '\/blog\/'/);
});

test('404 controls remain keyboard-visible and collapse to one column', async () => {
	const source = await readFile(notFoundUrl, 'utf8');

	assert.match(source, /min-block-size: 2\.75rem/);
	assert.match(source, /:focus-visible[\s\S]*outline: 0\.1875rem solid var\(--color-accent\)/);
	assert.match(source, /@media \(max-width: 30rem\)[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
});
