import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const baseLayoutUrl = new URL('../src/layouts/BaseLayout.astro', import.meta.url);
const sidebarUrl = new URL('../src/components/SiteSidebar.astro', import.meta.url);
const globalStylesUrl = new URL('../src/styles/global.css', import.meta.url);
const articleExplorerUrl = new URL('../src/components/ArticleExplorer.astro', import.meta.url);
const articleShowcaseUrl = new URL('../src/components/ArticleShowcase.astro', import.meta.url);
const articleFeedCardUrl = new URL('../src/components/ArticleFeedCard.astro', import.meta.url);
const articleIndexCardUrl = new URL('../src/components/ArticleIndexCard.astro', import.meta.url);
const skillShowcaseUrl = new URL('../src/components/SkillShowcase.astro', import.meta.url);
const projectGridUrl = new URL('../src/components/ProjectGrid.astro', import.meta.url);

test('shared layout provides an editorial main column and reusable sidebar', async () => {
	const [layout, sidebar] = await Promise.all([
		readFile(baseLayoutUrl, 'utf8'),
		readFile(sidebarUrl, 'utf8'),
	]);

	assert.match(layout, /import SiteSidebar from/);
	assert.match(layout, /showSidebar\?: boolean/);
	assert.match(layout, /--site-sidebar-min-inline-size: 11\.25rem/);
	assert.match(layout, /--site-sidebar-max-inline-size: 13\.5rem/);
	assert.match(layout, /--site-shell-column-gap: clamp\(var\(--space-3\), 3vw, var\(--space-4\)\)/);
	assert.match(
		layout,
		/grid-template-columns:\s*minmax\(0, 1fr\)\s*minmax\(var\(--site-sidebar-min-inline-size\), var\(--site-sidebar-max-inline-size\)\)/,
	);
	assert.doesNotMatch(layout, /minmax\(14rem, 17rem\)/);
	assert.match(layout, /\.page-content \{[\s\S]*?inline-size: 100%;[\s\S]*?min-inline-size: 0;[\s\S]*?max-inline-size: 100%/);
	assert.match(sidebar, /getArticleFeed\(\{ limit: 5 \}\)/);
	assert.match(sidebar, /getArticleTopics\(getArticleIndex\(\)\)/);
	assert.match(sidebar, /data-content-state=\{article\.state\}/);
	assert.match(sidebar, /<SocialLinks accessibleLabel="サイドバーの外部プロフィール" \/>/);
	assert.match(sidebar, /class="site-sidebar__topic-marker" aria-hidden="true"/);
	assert.match(sidebar, /class="site-sidebar__topic-label">\{topic\.label\}/);
	assert.match(sidebar, /class="site-sidebar__topic-count" aria-label=\{`\$\{topic\.count\}件`\}/);
	assert.match(sidebar, /\.site-sidebar__topics \{[\s\S]*?display: grid;[\s\S]*?list-style: none/);
	assert.match(
		sidebar,
		/grid-template-columns: 0\.35rem minmax\(0, 1fr\) minmax\(2ch, auto\)/,
	);
	assert.match(sidebar, /container: site-sidebar \/ inline-size/);
	assert.match(
		sidebar,
		/\.site-sidebar \{[\s\S]*?inline-size: 100%;[\s\S]*?min-inline-size: 0;[\s\S]*?max-inline-size: 100%/,
	);
	assert.match(sidebar, /@container site-sidebar \(max-width: 12rem\)/);
	assert.match(sidebar, /--site-sidebar-profile-icon-size: 4\.25rem/);
	assert.match(sidebar, /minmax\(0, var\(--site-sidebar-profile-icon-size\)\)\s*minmax\(0, 1fr\)/);
	assert.match(sidebar, /@container site-sidebar \(max-width: 12rem\)[\s\S]*?--site-sidebar-profile-icon-size: 3\.5rem/);
	assert.match(sidebar, /class="site-sidebar__profile-icon"/);
	assert.match(
		sidebar,
		/\.site-sidebar__profile-icon \{[\s\S]*?overflow: clip;[\s\S]*?inline-size: 100%;[\s\S]*?min-inline-size: 0;[\s\S]*?max-inline-size: 100%/,
	);
	assert.match(
		sidebar,
		/\.site-sidebar__profile-icon img \{[\s\S]*?inline-size: 100%;[\s\S]*?max-inline-size: 100%;[\s\S]*?block-size: 100%;[\s\S]*?max-block-size: 100%/,
	);
	assert.match(sidebar, /\.site-sidebar__profile > div \{\s*min-inline-size: 0/);
	assert.match(sidebar, /\.site-sidebar__recent time \{[\s\S]*?overflow-wrap: anywhere/);
});

test('editorial theme stays local, responsive, and motion-aware', async () => {
	const source = await readFile(globalStylesUrl, 'utf8');

	assert.match(source, /--content-width: 68rem/);
	assert.match(source, /--font-mono:/);
	assert.match(source, /--color-accent-alt:/);
	assert.match(source, /@media \(prefers-reduced-motion: reduce\)/);
	assert.doesNotMatch(source, /url\(|@import/);
});

test('redesign preserves article search, project interaction, and skill physics', async () => {
	const [articles, projects, skills] = await Promise.all([
		readFile(articleExplorerUrl, 'utf8'),
		readFile(projectGridUrl, 'utf8'),
		readFile(skillShowcaseUrl, 'utf8'),
	]);

	assert.match(articles, /data-search-form/);
	assert.match(articles, /data-kind-controls/);
	assert.match(projects, /data-project-node/);
	assert.match(projects, /node\.addEventListener\('click'/);
	assert.match(skills, /data-skill-field/);
	assert.match(skills, /startSkillPhysics/);
});

test('article layouts respond to their allocated column instead of the viewport', async () => {
	const [explorer, showcase, feedCard, indexCard] = await Promise.all([
		readFile(articleExplorerUrl, 'utf8'),
		readFile(articleShowcaseUrl, 'utf8'),
		readFile(articleFeedCardUrl, 'utf8'),
		readFile(articleIndexCardUrl, 'utf8'),
	]);

	assert.match(explorer, /container: article-explorer \/ inline-size/);
	assert.match(explorer, /@container article-explorer \(max-width: 64rem\)/);
	assert.match(explorer, /@container article-explorer \(max-width: 42rem\)/);
	assert.doesNotMatch(explorer, /@media \(max-width: (?:64|42)rem\)/);
	assert.match(showcase, /container: article-showcase \/ inline-size/);
	assert.match(showcase, /\.article-marquee \{[\s\S]*?inline-size: 100%;[\s\S]*?max-inline-size: 100%;[\s\S]*?margin-inline: 0/);
	assert.match(showcase, /inline-size: clamp\(17rem, 72cqi, 23rem\)/);
	assert.match(showcase, /@container article-showcase \(max-width: 30rem\)/);
	assert.doesNotMatch(showcase, /100vw|50vw|28vw|78vw/);
	assert.match(feedCard, /\.article-feed-card \{[\s\S]*?inline-size: 100%;[\s\S]*?max-inline-size: 100%/);
	assert.match(indexCard, /grid-template-columns: clamp\(3\.5rem, 16%, 7rem\) minmax\(0, 1fr\)/);
	assert.doesNotMatch(indexCard, /11vw/);
});
