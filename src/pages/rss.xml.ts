import type { APIRoute } from 'astro';
import { siteMetadata } from '../config/site.ts';
import { getBlogPosts } from '../content/blog/index.ts';
import { createRssDocument } from '../publication/documents.ts';

export const GET = (({ site }) => {
	if (!site) throw new Error('Astro site URL is required to generate RSS.');

	const items = getBlogPosts().map((post) => ({
		title: post.title,
		description: post.description,
		pathname: `/articles/${post.slug}/`,
		publishedAt: post.publishedAt,
	}));

	return new Response(
		createRssDocument({
			siteHref: site.href,
			title: `${siteMetadata.name} Articles`,
			description: siteMetadata.description,
			language: siteMetadata.language,
			items,
		}),
		{ headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } },
	);
}) satisfies APIRoute;
