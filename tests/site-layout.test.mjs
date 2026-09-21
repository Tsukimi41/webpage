import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const baseLayoutUrl = new URL('../src/layouts/BaseLayout.astro', import.meta.url);
const headerUrl = new URL('../src/components/SiteHeader.astro', import.meta.url);
const footerUrl = new URL('../src/components/SiteFooter.astro', import.meta.url);
const homeUrl = new URL('../src/pages/index.astro', import.meta.url);
const projectCardUrl = new URL('../src/components/ProjectCard.astro', import.meta.url);
const projectDetailUrl = new URL('../src/components/ProjectDetail.astro', import.meta.url);
const projectShowcaseUrl = new URL('../src/components/ProjectShowcase.astro', import.meta.url);

test('base layout includes shared header, main content, and footer', async () => {
	const source = await readFile(baseLayoutUrl, 'utf8');

	assert.match(source, /<SiteHeader \/>/);
	assert.match(source, /<main>/);
	assert.match(source, /<SiteFooter \/>/);
	assert.match(source, /<body id="site-top">/);
});

test('shared navigation exposes home, profile, blog, theme, and back-to-top links', async () => {
	const [header, footer] = await Promise.all([
		readFile(headerUrl, 'utf8'),
		readFile(footerUrl, 'utf8'),
	]);

	assert.match(header, /href="\/"[^>]*>Home</);
	assert.match(header, /href="\/profile\/"[^>]*>Profile</);
	assert.match(header, /href="\/blog\/"[^>]*>Blog</);
	assert.match(header, /<ThemeSwitcher \/>/);
	assert.match(header, /\.site-header__nav \{[\s\S]*margin-inline-start: auto/);
	assert.match(header, /\.site-header__nav li::before/);
	assert.match(header, /opacity: 0/);
	assert.match(header, /\.site-header__nav a:hover \{[\s\S]*color-mix\(in srgb, var\(--color-accent\) 52%, transparent\)/);
	assert.match(header, /\.site-header__nav a\[aria-current='page'\],[\s\S]*border-block-end-color: var\(--color-accent\)/);
	assert.match(footer, /<SocialLinks accessibleLabel="外部プロフィール" \/>/);
	assert.match(footer, /class="site-footer__divider"/);
	assert.match(footer, /class="site-footer__top-icon" aria-hidden="true">↑<\/span>/);
	assert.match(footer, /class="site-footer__site-nav"/);
	assert.ok(
		footer.indexOf('<SocialLinks') < footer.indexOf('class="site-footer__divider"') &&
			footer.indexOf('class="site-footer__divider"') < footer.indexOf('href="/">Home'),
	);
	assert.match(footer, /href="#site-top"/);
	assert.match(footer, /<span>一番上へ<\/span>/);
});

test('project activity no longer exposes role metadata or project list CTA', async () => {
	const [card, detail, showcase, home] = await Promise.all([
		readFile(projectCardUrl, 'utf8'),
		readFile(projectDetailUrl, 'utf8'),
		readFile(projectShowcaseUrl, 'utf8'),
		readFile(homeUrl, 'utf8'),
	]);

	assert.doesNotMatch(card, /担当|project\.role|project-card__role/);
	assert.doesNotMatch(detail, /担当|project\.role/);
	assert.doesNotMatch(showcase, /すべてのプロジェクトを見る/);
	assert.match(home, /getProjects/);
	assert.doesNotMatch(home, /getFeaturedProjects/);
});
