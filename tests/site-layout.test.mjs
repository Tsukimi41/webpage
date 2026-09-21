import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { defineProfile, profile } from '../src/data/profile.ts';

const baseLayoutUrl = new URL('../src/layouts/BaseLayout.astro', import.meta.url);
const headerUrl = new URL('../src/components/SiteHeader.astro', import.meta.url);
const footerUrl = new URL('../src/components/SiteFooter.astro', import.meta.url);
const backToTopUrl = new URL('../src/components/BackToTopLink.astro', import.meta.url);
const profileIntroductionUrl = new URL('../src/components/ProfileIntroduction.astro', import.meta.url);
const profilePageUrl = new URL('../src/pages/profile.astro', import.meta.url);
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
	assert.match(source, /href=\{profile\.icon\.src\}/);
});

test('shared navigation exposes home, profile, articles, theme, and back-to-top links', async () => {
	const [header, footer, backToTop] = await Promise.all([
		readFile(headerUrl, 'utf8'),
		readFile(footerUrl, 'utf8'),
		readFile(backToTopUrl, 'utf8'),
	]);

	assert.match(header, /href="\/"[^>]*>Home</);
	assert.match(header, /href="\/profile\/"[^>]*>Profile</);
	assert.match(header, /href="\/articles\/"[^>]*>Articles</);
	assert.doesNotMatch(header, /href="\/blog\/"|>Blog</);
	assert.match(header, /<ThemeSwitcher \/>/);
	assert.match(header, /\.site-header__nav \{[\s\S]*margin-inline-start: auto/);
	assert.match(header, /\.site-header__nav li::before/);
	assert.match(header, /opacity: 0/);
	assert.match(header, /\.site-header__nav a:hover \{[\s\S]*color-mix\(in srgb, var\(--color-accent\) 52%, transparent\)/);
	assert.match(header, /\.site-header__nav a\[aria-current='page'\],[\s\S]*border-block-end-color: var\(--color-accent\)/);
	assert.match(footer, /<SocialLinks accessibleLabel="外部プロフィール" \/>/);
	assert.match(footer, /<BackToTopLink \/>/);
	assert.match(footer, /class="site-footer__divider"/);
	assert.match(footer, /href="\/articles\/">Articles</);
	assert.doesNotMatch(footer, /href="\/blog\/"|>Blog</);
	assert.doesNotMatch(footer, /site-footer__top|site-footer__top-icon/);
	assert.match(footer, /class="site-footer__site-nav"/);
	assert.ok(
		footer.indexOf('<SocialLinks') < footer.indexOf('class="site-footer__divider"') &&
			footer.indexOf('class="site-footer__divider"') < footer.indexOf('href="/">Home'),
	);
	assert.match(backToTop, /href = '#site-top'/);
	assert.match(backToTop, /label = '一番上へ戻る'/);
	assert.match(backToTop, /aria-label=\{label\}/);
	assert.match(backToTop, /<circle cx="32" cy="32" r="30"><\/circle>/);
	assert.match(backToTop, /<path d="M18 35\.5 32 21l14 14\.5M32 22v22"><\/path>/);
	assert.match(backToTop, /border-radius: 50%/);
	assert.match(backToTop, /inline-size: 3rem/);
	assert.doesNotMatch(backToTop, /SocialLinks|social-links__/);
});

test('profile introduction places the favicon icon beside readable profile content', async () => {
	const source = await readFile(profileIntroductionUrl, 'utf8');

	assert.match(source, /class="introduction__content"/);
	assert.match(source, /class="introduction__visual"/);
	assert.match(source, /class="introduction__icon"[\s\S]*src=\{profile\.icon\.src\}/);
	assert.match(source, /width=\{profile\.icon\.width\}/);
	assert.match(source, /height=\{profile\.icon\.height\}/);
	assert.match(source, /alt=\{`\$\{profile\.handle\} \/ \$\{profile\.penName\} のアイコン`\}/);
	assert.match(source, /--introduction-icon-max-size: 16rem/);
	assert.match(source, /--introduction-icon-track-ratio: 36%/);
	assert.match(
		source,
		/grid-template-columns:\s*minmax\(0, 1fr\)\s*minmax\(\s*0,\s*min\(var\(--introduction-icon-max-size\), var\(--introduction-icon-track-ratio\)\)\s*\)/,
	);
	assert.match(
		source,
		/\.introduction \{[\s\S]*?box-sizing: border-box;[\s\S]*?inline-size: 100%;[\s\S]*?min-inline-size: 0;[\s\S]*?max-inline-size: 100%/,
	);
	assert.match(
		source,
		/\.introduction__visual \{[\s\S]*?inline-size: 100%;[\s\S]*?min-inline-size: 0;[\s\S]*?max-inline-size: var\(--introduction-icon-max-size\)/,
	);
	assert.match(
		source,
		/\.introduction__icon \{[\s\S]*?inline-size: 100%;[\s\S]*?max-inline-size: 100%;[\s\S]*?block-size: auto;[\s\S]*?object-fit: contain/,
	);
	assert.match(source, /\.introduction__name \{[\s\S]*?flex-wrap: wrap;[\s\S]*?white-space: normal/);
	assert.doesNotMatch(source, /@media \(max-width: 30rem\)[\s\S]*grid-template-columns: 1fr;/);
	const visualStyles = source.match(/\.introduction__visual \{([\s\S]*?)\n\t\}/)?.[1] ?? '';
	assert.doesNotMatch(visualStyles, /(?:^|\s)(?:padding|border|background|box-shadow)\s*:/);
	assert.doesNotMatch(visualStyles, /(?:^|\s)(?:margin-inline|inset-inline|translate)\s*:/);
	assert.deepEqual(profile.icon, { src: '/favicon.ico', width: 256, height: 256 });
	assert.equal(Object.isFrozen(profile.icon), true);
	assert.throws(
		() => defineProfile({ ...profile, icon: { ...profile.icon, src: 'https://example.com/icon.png' } }),
		/site-relative path/,
	);
	assert.throws(
		() => defineProfile({ ...profile, icon: { ...profile.icon, width: 0 } }),
		/positive safe integer/,
	);
});

test('profile page renders typed profile details through the dedicated component', async () => {
	const source = await readFile(profilePageUrl, 'utf8');

	assert.match(source, /import ProfileDetails from/);
	assert.match(source, /import \{ getProfileDetail \} from/);
	assert.match(source, /const detail = getProfileDetail\(\)/);
	assert.match(source, /<ProfileDetails detail=\{detail\} \/>/);
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
