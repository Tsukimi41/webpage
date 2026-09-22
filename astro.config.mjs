// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import { defineSiteUrl } from './src/config/site.ts';
import publicationGuard from './src/integrations/publication-guard.mjs';

const siteUrl = defineSiteUrl(process.env.PUBLIC_SITE_URL);
const deploymentUrl = new URL(siteUrl.href);
const base = deploymentUrl.pathname === '/' ? '/' : deploymentUrl.pathname.slice(0, -1);

export default defineConfig({
	site: deploymentUrl.origin,
	base,
	integrations: [icon(), publicationGuard()],
});
