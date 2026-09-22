import type { APIRoute } from 'astro';
import { defineSiteUrl } from '../config/site.ts';
import { getBlogPosts } from '../content/blog/index.ts';
import { getProjects } from '../content/projects/index.ts';
import { createSitemapDocument } from '../publication/documents.ts';

export const GET = (() => {
	const siteUrl = defineSiteUrl(import.meta.env.PUBLIC_SITE_URL);

	const posts = getBlogPosts();
	const entries = [
		{ pathname: '/' },
		{ pathname: '/profile/' },
		{ pathname: '/projects/' },
		{ pathname: '/articles/' },
		...getProjects().map((project) => ({ pathname: `/projects/${project.slug}/` })),
		...posts.map((post) => ({
			pathname: `/articles/${post.slug}/`,
			lastModified: post.updatedAt,
		})),
	];

	return new Response(createSitemapDocument(siteUrl.href, entries), {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' },
	});
}) satisfies APIRoute;
