import type { APIRoute } from 'astro';
import { defineSiteUrl } from '../config/site.ts';
import { createRobotsDocument } from '../publication/documents.ts';

export const GET = (() => {
	const siteUrl = defineSiteUrl(import.meta.env.PUBLIC_SITE_URL);
	return new Response(createRobotsDocument(siteUrl.href, siteUrl.isPublic), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
}) satisfies APIRoute;
