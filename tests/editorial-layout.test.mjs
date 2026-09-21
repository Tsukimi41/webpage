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
	assert.match(layout, /grid-template-columns: minmax\(0, 1fr\) minmax\(14rem, 17rem\)/);
	assert.match(sidebar, /getArticleFeed\(\{ limit: 5 \}\)/);
	assert.match(sidebar, /getArticleTopics\(getArticleIndex\(\)\)/);
	assert.match(sidebar, /data-content-state=\{article\.state\}/);
	assert.match(sidebar, /<SocialLinks accessibleLabel="サイドバーの外部プロフィール" \/>/);
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
