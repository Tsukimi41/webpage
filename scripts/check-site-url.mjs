import { defineSiteUrl, SITE_URL_ENV_NAME } from '../src/config/site.ts';

const siteUrl = defineSiteUrl(process.env[SITE_URL_ENV_NAME]);

if (!siteUrl.isPublic) {
	throw new Error(`${SITE_URL_ENV_NAME} is required for a public release.`);
}

console.log(`Public site URL is valid: ${siteUrl.href}`);
