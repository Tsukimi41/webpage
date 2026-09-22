import type { APIRoute } from 'astro';
import { defineSiteUrl, siteMetadata } from '../config/site.ts';
import { getBlogPosts } from '../content/blog/index.ts';
import { createRssDocument } from '../publication/documents.ts';

export const GET = (() => {
	const siteUrl = defineSiteUrl(import.meta.env.PUBLIC_SITE_URL);

	const items = getBlogPosts().map((post) => ({
		title: post.title,
		description: post.description,
		pathname: `/articles/${post.slug}/`,
		publishedAt: post.publishedAt,
	}));

	return new Response(
		createRssDocument({
			siteHref: siteUrl.href,
			title: `${siteMetadata.name} Articles`,
			description: siteMetadata.description,
			language: siteMetadata.language,
			items,
		}),
		{ headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } },
	);
}) satisfies APIRoute;
