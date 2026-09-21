import type { APIRoute } from 'astro';
import { defineSiteUrl } from '../config/site.ts';
import { createRobotsDocument } from '../publication/documents.ts';

export const GET = (({ site }) => {
	if (!site) throw new Error('Astro site URL is required to generate robots.txt.');

	const siteUrl = defineSiteUrl(import.meta.env?.PUBLIC_SITE_URL);
	return new Response(createRobotsDocument(site.href, siteUrl.isPublic), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
}) satisfies APIRoute;
