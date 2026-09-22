import { profile, profileDisplayName } from '../data/profile.ts';

export const SITE_URL_ENV_NAME = 'PUBLIC_SITE_URL';
export const LOCAL_SITE_URL = 'http://localhost:4321/';

export const siteMetadata = Object.freeze({
	name: `${profileDisplayName} Portfolio`,
	description: `${profileDisplayName}の制作物、技術メモ、プロフィールを掲載するポートフォリオサイトです。`,
	language: 'ja',
	locale: 'ja_JP',
	authorName: profileDisplayName,
	authorHandle: profile.handle,
});

export interface SiteUrlConfig {
	readonly href: string;
	readonly isPublic: boolean;
}

function parsePublicSiteUrl(value: string): URL {
	let url: URL;

	try {
		url = new URL(value);
	} catch {
		throw new Error(`${SITE_URL_ENV_NAME} must be an absolute HTTPS URL.`);
	}

	if (url.protocol !== 'https:') {
		throw new Error(`${SITE_URL_ENV_NAME} must use HTTPS: ${value}`);
	}

	if (url.username || url.password) {
		throw new Error(`${SITE_URL_ENV_NAME} must not contain credentials.`);
	}

	if (url.search || url.hash) {
		throw new Error(`${SITE_URL_ENV_NAME} must not contain a query or hash.`);
	}

	if (url.pathname.includes('\\') || /\s/.test(url.pathname)) {
		throw new Error(`${SITE_URL_ENV_NAME} must contain a clean deployment path.`);
	}

	if (!url.pathname.endsWith('/')) url.pathname += '/';

	return url;
}

export function defineSiteUrl(value: string | undefined): Readonly<SiteUrlConfig> {
	const normalizedValue = value?.trim();

	if (!normalizedValue) {
		return Object.freeze({ href: LOCAL_SITE_URL, isPublic: false });
	}

	const url = parsePublicSiteUrl(normalizedValue);
	return Object.freeze({ href: url.href, isPublic: true });
}

export function createCanonicalUrl(siteHref: string, pathname: string): string {
	const site = new URL(siteHref);
	const isLocalHttp = site.href === LOCAL_SITE_URL;

	if ((site.protocol !== 'https:' && !isLocalHttp) || site.username || site.password) {
		throw new Error(`Canonical site URL must use HTTPS or the local fallback: ${siteHref}`);
	}

	if (!site.pathname.endsWith('/') || site.search || site.hash) {
		throw new Error(`Canonical site URL must be a normalized site root: ${siteHref}`);
	}

	if (!pathname.startsWith('/') || pathname.startsWith('//') || /[\s?#]/.test(pathname)) {
		throw new Error(`Canonical pathname must be a clean site-relative path: ${pathname}`);
	}

	const siteBasePath = site.pathname === '/' ? '' : site.pathname.slice(0, -1);
	const routePath = siteBasePath !== '' && (pathname === siteBasePath || pathname.startsWith(`${siteBasePath}/`))
		? pathname.slice(siteBasePath.length) || '/'
		: pathname;

	return new URL(routePath.slice(1), site).href;
}

export function createSitePath(basePath: string, pathname: string): `/${string}` {
	if (!basePath.startsWith('/') || basePath.startsWith('//') || /[\s?#]/.test(basePath)) {
		throw new Error(`Base path must be a clean site-relative path: ${basePath}`);
	}

	if (!pathname.startsWith('/') || pathname.startsWith('//') || /\s/.test(pathname)) {
		throw new Error(`Pathname must be a site-relative path: ${pathname}`);
	}

	const normalizedBase = basePath === '/' ? '' : `/${basePath.split('/').filter(Boolean).join('/')}`;
	return `${normalizedBase}${pathname}` as `/${string}`;
}

export function serializeJsonLd(value: unknown): string {
	return JSON.stringify(value).replaceAll('<', '\\u003c');
}
