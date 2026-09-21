import { createCanonicalUrl } from '../config/site.ts';

export interface RssItemDefinition {
	readonly title: string;
	readonly description: string;
	readonly pathname: string;
	readonly publishedAt: string;
}

export interface RssDocumentDefinition {
	readonly siteHref: string;
	readonly title: string;
	readonly description: string;
	readonly language: string;
	readonly items: readonly RssItemDefinition[];
}

export interface SitemapEntryDefinition {
	readonly pathname: string;
	readonly lastModified?: string;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function requireText(value: string, fieldPath: string): string {
	const normalizedValue = value.trim();

	if (!normalizedValue) {
		throw new Error(`${fieldPath} must not be empty.`);
	}

	return normalizedValue;
}

function requireDate(value: string, fieldPath: string): string {
	if (!ISO_DATE_PATTERN.test(value)) {
		throw new Error(`${fieldPath} must use YYYY-MM-DD format: ${value}`);
	}

	const date = new Date(`${value}T00:00:00.000Z`);

	if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
		throw new Error(`${fieldPath} must be a valid calendar date: ${value}`);
	}

	return value;
}

export function escapeXml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

export function createRssDocument(definition: RssDocumentDefinition): string {
	const title = requireText(definition.title, 'rss.title');
	const description = requireText(definition.description, 'rss.description');
	const language = requireText(definition.language, 'rss.language');
	const channelUrl = createCanonicalUrl(definition.siteHref, '/blog/');
	const feedUrl = createCanonicalUrl(definition.siteHref, '/rss.xml');
	const usedPaths = new Set<string>();

	const items = definition.items.map((item, index) => {
		const itemPath = `rss.items[${index}]`;
		const publishedAt = requireDate(item.publishedAt, `${itemPath}.publishedAt`);
		const href = createCanonicalUrl(definition.siteHref, item.pathname);

		if (usedPaths.has(href)) {
			throw new Error(`RSS contains a duplicate item URL: ${href}`);
		}

		usedPaths.add(href);
		return {
			title: requireText(item.title, `${itemPath}.title`),
			description: requireText(item.description, `${itemPath}.description`),
			href,
			publishedAt,
		};
	}).sort(
		(left, right) =>
			right.publishedAt.localeCompare(left.publishedAt) || left.href.localeCompare(right.href),
	);

	const itemXml = items.map((item) => [
		'<item>',
		`<title>${escapeXml(item.title)}</title>`,
		`<description>${escapeXml(item.description)}</description>`,
		`<link>${escapeXml(item.href)}</link>`,
		`<guid isPermaLink="true">${escapeXml(item.href)}</guid>`,
		`<pubDate>${new Date(`${item.publishedAt}T00:00:00.000Z`).toUTCString()}</pubDate>`,
		'</item>',
	].join('')).join('');

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
		'<channel>',
		`<title>${escapeXml(title)}</title>`,
		`<description>${escapeXml(description)}</description>`,
		`<link>${escapeXml(channelUrl)}</link>`,
		`<language>${escapeXml(language)}</language>`,
		`<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
		itemXml,
		'</channel>',
		'</rss>',
	].join('');
}

export function createSitemapDocument(
	siteHref: string,
	entries: readonly SitemapEntryDefinition[],
): string {
	const usedUrls = new Set<string>();
	const normalizedEntries = entries.map((entry, index) => {
		const url = createCanonicalUrl(siteHref, entry.pathname);

		if (usedUrls.has(url)) {
			throw new Error(`Sitemap contains a duplicate URL: ${url}`);
		}

		usedUrls.add(url);
		return {
			url,
			lastModified: entry.lastModified
				? requireDate(entry.lastModified, `sitemap.entries[${index}].lastModified`)
				: undefined,
		};
	}).sort((left, right) => left.url.localeCompare(right.url));

	const entryXml = normalizedEntries.map((entry) => [
		'<url>',
		`<loc>${escapeXml(entry.url)}</loc>`,
		entry.lastModified ? `<lastmod>${entry.lastModified}</lastmod>` : '',
		'</url>',
	].join('')).join('');

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		entryXml,
		'</urlset>',
	].join('');
}

export function createRobotsDocument(siteHref: string, isPublic: boolean): string {
	const sitemapUrl = createCanonicalUrl(siteHref, '/sitemap.xml');
	return [
		'User-agent: *',
		isPublic ? 'Allow: /' : 'Disallow: /',
		`Sitemap: ${sitemapUrl}`,
		'',
	].join('\n');
}
