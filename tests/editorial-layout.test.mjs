import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const baseLayoutUrl = new URL('../src/layouts/BaseLayout.astro', import.meta.url);
const sidebarUrl = new URL('../src/components/SiteSidebar.astro', import.meta.url);
const globalStylesUrl = new URL('../src/styles/global.css', import.meta.url);
const articleExplorerUrl = new URL('../src/components/ArticleExplorer.astro', import.meta.url);
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
