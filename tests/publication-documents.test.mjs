import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
	LOCAL_SITE_URL,
	createCanonicalUrl,
	defineSiteUrl,
	serializeJsonLd,
	siteMetadata,
} from '../src/config/site.ts';
import {
	createRobotsDocument,
	createRssDocument,
	createSitemapDocument,
	escapeXml,
} from '../src/publication/documents.ts';

test('site URL configuration is safe by default and normalizes a public HTTPS origin', () => {
	for (const value of [undefined, '', '   ']) {
		const config = defineSiteUrl(value);
		assert.deepEqual(config, { href: LOCAL_SITE_URL, isPublic: false });
		assert.ok(Object.isFrozen(config));
	}

	assert.deepEqual(defineSiteUrl(' https://portfolio.example '), {
		href: 'https://portfolio.example/',
		isPublic: true,
	});
	assert.ok(Object.isFrozen(siteMetadata));
});

test('site URL configuration rejects unsafe, partial, and non-origin values', () => {
	for (const value of [
		'portfolio.example',
		'http://portfolio.example',
		'https://user:secret@portfolio.example',
		'https://portfolio.example/path',
		'https://portfolio.example/?query=yes',
		'https://portfolio.example/#section',
	]) {
		assert.throws(() => defineSiteUrl(value));
	}
});

test('canonical URLs accept clean paths and reject ambiguous inputs', () => {
	assert.equal(
		createCanonicalUrl('https://portfolio.example/', '/blog/post/'),
		'https://portfolio.example/blog/post/',
	);
	assert.equal(createCanonicalUrl(LOCAL_SITE_URL, '/'), LOCAL_SITE_URL);

	for (const pathname of ['blog/', '//outside.example/', '/blog/?page=1', '/blog/#top', '/bad path/']) {
		assert.throws(() => createCanonicalUrl('https://portfolio.example/', pathname));
	}

	assert.throws(() => createCanonicalUrl('http://portfolio.example/', '/'));
	assert.throws(() => createCanonicalUrl('https://portfolio.example/base/', '/'));
});

test('JSON-LD and XML serializers neutralize markup characters', () => {
	assert.equal(serializeJsonLd({ value: '</script><b>' }), '{"value":"\\u003c/script>\\u003cb>"}');
	assert.equal(
		escapeXml(`A & B < C > D "quoted" 'single'`),
		'A &amp; B &lt; C &gt; D &quot;quoted&quot; &apos;single&apos;',
	);
});

test('RSS supports zero, one, and multiple items with deterministic newest-first order', () => {
	const emptyFeed = createRssDocument({
		siteHref: 'https://portfolio.example/',
		title: 'Portfolio Blog',
		description: 'Description',
		language: 'ja',
		items: [],
	});
	assert.match(emptyFeed, /<rss version="2\.0"/);
	assert.doesNotMatch(emptyFeed, /<item>/);

	const feed = createRssDocument({
		siteHref: 'https://portfolio.example/',
		title: 'A & B',
		description: 'Description',
		language: 'ja',
		items: [
			{
				title: 'Older',
				description: 'Old description',
				pathname: '/blog/older/',
				publishedAt: '2026-01-01',
			},
			{
				title: 'Newer <Post>',
				description: 'New description',
				pathname: '/blog/newer/',
				publishedAt: '2026-02-01',
			},
		],
	});

	assert.match(feed, /<title>A &amp; B<\/title>/);
	assert.match(feed, /Newer &lt;Post&gt;/);
	assert.ok(feed.indexOf('/blog/newer/') < feed.indexOf('/blog/older/'));
	assert.equal((feed.match(/<item>/g) ?? []).length, 2);
});

test('RSS rejects invalid items, duplicate URLs, and malformed dates', () => {
	const base = {
		siteHref: 'https://portfolio.example/',
		title: 'Title',
		description: 'Description',
		language: 'ja',
	};
	const item = {
		title: 'Post',
		description: 'Description',
		pathname: '/blog/post/',
		publishedAt: '2026-01-01',
	};

	assert.throws(() => createRssDocument({ ...base, items: [item, item] }), /duplicate item URL/);
	assert.throws(
		() => createRssDocument({ ...base, items: [{ ...item, publishedAt: '2026-02-30' }] }),
		/valid calendar date/,
	);
	assert.throws(
		() => createRssDocument({ ...base, items: [{ ...item, title: ' ' }] }),
		/must not be empty/,
	);
});

test('sitemap supports empty and multiple entries while rejecting duplicates', () => {
	const emptySitemap = createSitemapDocument('https://portfolio.example/', []);
	assert.match(emptySitemap, /<urlset/);
	assert.doesNotMatch(emptySitemap, /<url>/);

	const sitemap = createSitemapDocument('https://portfolio.example/', [
		{ pathname: '/profile/' },
		{ pathname: '/', lastModified: '2026-01-02' },
	]);
	assert.equal((sitemap.match(/<url>/g) ?? []).length, 2);
	assert.match(sitemap, /<lastmod>2026-01-02<\/lastmod>/);
	assert.ok(sitemap.indexOf('https://portfolio.example/</loc>') < sitemap.indexOf('/profile/'));

	assert.throws(
		() => createSitemapDocument('https://portfolio.example/', [{ pathname: '/' }, { pathname: '/' }]),
		/duplicate URL/,
	);
});

test('robots output defaults to blocking and only allows an explicitly public site', () => {
	const blocked = createRobotsDocument(LOCAL_SITE_URL, false);
	assert.match(blocked, /Disallow: \//);
	assert.match(blocked, /Sitemap: http:\/\/localhost:4321\/sitemap\.xml/);

	const publicRobots = createRobotsDocument('https://portfolio.example/', true);
	assert.match(publicRobots, /Allow: \//);
	assert.doesNotMatch(publicRobots, /Disallow/);
});

test('base layout exposes canonical, robots, sharing, RSS, and JSON-LD metadata', async () => {
	const [layout, footer, blogPage, packageSource] = await Promise.all([
		readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8'),
		readFile(new URL('../src/components/SiteFooter.astro', import.meta.url), 'utf8'),
		readFile(new URL('../src/pages/blog/[slug].astro', import.meta.url), 'utf8'),
		readFile(new URL('../package.json', import.meta.url), 'utf8'),
	]);

	assert.match(layout, /rel="canonical"/);
	assert.match(layout, /name="robots"/);
	assert.match(layout, /property="og:title"/);
	assert.match(layout, /name="twitter:card"/);
	assert.match(layout, /application\/ld\+json/);
	assert.match(layout, /application\/rss\+xml/);
	assert.match(footer, /href="\/rss\.xml">RSS</);
	assert.match(blogPage, /pageType="article"/);
	assert.match(blogPage, /publishedAt=\{post\.publishedAt\}/);
	assert.match(
		packageSource,
		/"build:release": "npm run test:content && npm run check:release && astro build"/,
	);
});
