import type { APIRoute } from 'astro';
import { getBlogPosts, getBlogTags } from '../content/blog/index.ts';
import { getProjects } from '../content/projects/index.ts';
import { createSitemapDocument } from '../publication/documents.ts';

export const GET = (({ site }) => {
	if (!site) throw new Error('Astro site URL is required to generate a sitemap.');

	const posts = getBlogPosts();
	const entries = [
		{ pathname: '/' },
		{ pathname: '/profile/' },
		{ pathname: '/projects/' },
		{ pathname: '/blog/' },
		{ pathname: '/blog/tags/' },
		{ pathname: '/articles/' },
		...getProjects().map((project) => ({ pathname: `/projects/${project.slug}/` })),
		...posts.map((post) => ({
			pathname: `/blog/${post.slug}/`,
			lastModified: post.updatedAt,
		})),
		...getBlogTags().map((tag) => ({ pathname: `/blog/tags/${tag.id}/` })),
	];

	return new Response(createSitemapDocument(site.href, entries), {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' },
	});
}) satisfies APIRoute;
