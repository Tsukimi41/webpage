import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const sourceUrl = (path) => new URL(`../${path}`, import.meta.url);

test('public navigation exposes Articles without a dedicated Blog section', async () => {
	const sources = await Promise.all([
		readFile(sourceUrl('src/components/SiteHeader.astro'), 'utf8'),
		readFile(sourceUrl('src/components/SiteFooter.astro'), 'utf8'),
		readFile(sourceUrl('src/pages/404.astro'), 'utf8'),
	]);

	for (const source of sources) {
		assert.doesNotMatch(source, /href=(?:"|')\/blog\//);
		assert.doesNotMatch(source, />Blog</);
	}
});

test('long-form posts are published as Articles and retain topic and related links', async () => {
	const [queries, articlePage, articleBody] = await Promise.all([
		readFile(sourceUrl('src/content/articles/queries.ts'), 'utf8'),
		readFile(sourceUrl('src/pages/articles/[slug].astro'), 'utf8'),
		readFile(sourceUrl('src/components/BlogArticle.astro'), 'utf8'),
	]);

	assert.match(queries, /href: `\/articles\/\$\{post\.slug\}\//);
	assert.match(articlePage, /getBlogEntry/);
	assert.match(articlePage, /getRelatedBlogPosts/);
	assert.match(articleBody, /const articlesHref = createSitePath\(import\.meta\.env\.BASE_URL, '\/articles\/'\)/);
	assert.match(articleBody, /href=\{articlesHref\}>記事一覧へ戻る/);
	assert.match(articleBody, /createSitePath\(import\.meta\.env\.BASE_URL, `\/articles\/\?topic=\$\{encodeURIComponent\(tag\.id\)\}`\)/);
	assert.match(articleBody, /createSitePath\(import\.meta\.env\.BASE_URL, `\/articles\/\$\{relatedPost\.slug\}\//);
	assert.doesNotMatch(articleBody, /href=\{?`?\/blog\//);
});

test('legacy Blog pages redirect safely under the configured deployment base', async () => {
	const [redirectComponent, blogIndex, blogPost, tagIndex, tagPage] = await Promise.all([
		readFile(sourceUrl('src/components/LegacyRedirect.astro'), 'utf8'),
		readFile(sourceUrl('src/pages/blog/index.astro'), 'utf8'),
		readFile(sourceUrl('src/pages/blog/[slug].astro'), 'utf8'),
		readFile(sourceUrl('src/pages/blog/tags/index.astro'), 'utf8'),
		readFile(sourceUrl('src/pages/blog/tags/[tag].astro'), 'utf8'),
	]);

	assert.match(redirectComponent, /createSitePath\(import\.meta\.env\.BASE_URL, target\)/);
	assert.match(redirectComponent, /http-equiv="refresh" content=\{`0;url=\$\{destination\}`\}/);
	assert.match(redirectComponent, /name="robots" content="noindex, follow"/);
	assert.match(blogIndex, /target="\/articles\/"/);
	assert.match(blogPost, /target=\{`\/articles\/\$\{post\.slug\}\//);
	assert.match(tagIndex, /target="\/articles\/"/);
	assert.match(tagPage, /target=\{`\/articles\/\?topic=\$\{encodeURIComponent\(tag\.id\)\}`\}/);
});

test('RSS and sitemap publish only canonical Article URLs', async () => {
	const sources = await Promise.all([
		readFile(sourceUrl('src/pages/rss.xml.ts'), 'utf8'),
		readFile(sourceUrl('src/pages/sitemap.xml.ts'), 'utf8'),
		readFile(sourceUrl('src/publication/documents.ts'), 'utf8'),
	]);

	for (const source of sources) {
		assert.doesNotMatch(source, /`\/blog\/\$\{|createCanonicalUrl\(definition\.siteHref, '\/blog\/'\)/);
	}

	assert.match(sources[0], /pathname: `\/articles\/\$\{post\.slug\}\//);
	assert.match(sources[1], /pathname: `\/articles\/\$\{post\.slug\}\//);
	assert.match(sources[2], /createCanonicalUrl\(definition\.siteHref, '\/articles\/'\)/);
});
