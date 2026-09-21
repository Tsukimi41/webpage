// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import { defineSiteUrl } from './src/config/site.ts';
import publicationGuard from './src/integrations/publication-guard.mjs';

const siteUrl = defineSiteUrl(process.env.PUBLIC_SITE_URL);

export default defineConfig({
	site: siteUrl.href,
	integrations: [icon(), publicationGuard()],
});
