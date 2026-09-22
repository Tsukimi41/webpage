import assert from 'node:assert/strict';
import test from 'node:test';

import {
	filterArticleSearch,
	getArticleFeed,
	getArticleIndex,
	getArticleTopics,
	matchesArticleSearch,
	normalizeArticleSearchText,
	parseArticleSearchKind,
} from '../src/content/articles/index.ts';

test('article feed combines project details and blog posts without duplicating their source data', () => {
	const items = getArticleFeed();

	assert.equal(items.length, 24);
	assert.equal(items.filter((item) => item.sourceKind === 'project').length, 19);
	assert.equal(items.filter((item) => item.sourceKind === 'blog').length, 5);
	assert.equal(items.every((item) => item.href), true);
	assert.equal(
		items.filter((item) => item.sourceKind === 'blog').every((item) => item.href?.startsWith('/articles/')),
		true,
	);
	assert.equal(items.some((item) => item.summary.length > 0), true);
	assert.equal(Object.isFrozen(items), true);
});

test('article feed supports state filtering and a deterministic limit', () => {
	assert.equal(getArticleFeed({ states: ['published'] }).length, 19);
	assert.deepEqual(
		getArticleFeed({ limit: 2 }).map((item) => item.id),
		['project-scratch-first-programming', 'project-international-life'],
	);
	assert.deepEqual(getArticleFeed({ limit: 0 }), []);
	assert.throws(() => getArticleFeed({ limit: -1 }), /non-negative safe integer/);
	assert.throws(() => getArticleFeed({ limit: 1.5 }), /non-negative safe integer/);
});

test('article index carries normalized searchable topics without copying source content', () => {
	const items = getArticleIndex();

	assert.equal(items.length, 24);
	assert.deepEqual(
		items.slice(0, 4).map((item) => item.id),
		[
			'project-scratch-first-programming',
			'project-international-life',
			'project-ultimate-fruit-catch',
			'project-debate-and-model-un',
		],
	);
	assert.equal(items.every(Object.isFrozen), true);
	assert.equal(items.every((item) => Object.isFrozen(item.topicIds)), true);
	assert.equal(items.every((item) => Object.isFrozen(item.topicLabels)), true);
	assert.equal(items.every((item) => item.href.startsWith('/')), true);
	assert.equal(items.every((item) => item.searchText === normalizeArticleSearchText(item.searchText)), true);
});

test('article topics merge matching skill and tag ids with deterministic counts', () => {
	const topics = getArticleTopics(getArticleIndex());
	const astro = topics.find((topic) => topic.id === 'astro');
	const webDevelopment = topics.find((topic) => topic.id === 'web-development');

	assert.deepEqual(astro, { id: 'astro', label: 'Astro', count: 3 });
	assert.deepEqual(webDevelopment, { id: 'web-development', label: 'Web制作', count: 2 });
	assert.equal(Object.isFrozen(topics), true);
	assert.equal(topics.every(Object.isFrozen), true);
	assert.throws(
		() =>
			getArticleTopics([
				{ ...getArticleIndex()[0], topicIds: ['shared-topic'], topicLabels: ['First label'] },
				{ ...getArticleIndex()[1], topicIds: ['shared-topic'], topicLabels: ['Second label'] },
			]),
		/inconsistent labels/,
	);
	assert.throws(
		() => getArticleTopics([{ ...getArticleIndex()[0], topicIds: ['missing-label'], topicLabels: [] }]),
		/missing its label/,
	);
});

test('article search normalizes text and combines query, kind, and topic filters', () => {
	const items = getArticleIndex();

	assert.equal(normalizeArticleSearchText('  ＡＳＴＲＯ   TypeScript  '), 'astro typescript');
	assert.equal(parseArticleSearchKind('project'), 'project');
	assert.equal(parseArticleSearchKind('unsupported'), 'all');
	assert.equal(filterArticleSearch(items).length, 24);
	assert.deepEqual(
		filterArticleSearch(items, { query: 'Astro TypeScript' }).map((item) => item.id),
		['project-personal-web-development', 'project-smart-beekeeping', 'blog-astro-foundation-notes'],
	);
	assert.deepEqual(
		filterArticleSearch(items, { kind: 'blog' }).map((item) => item.id),
		[
			'blog-arch1',
			'blog-my-first-post',
			'blog-mock-command-notes',
			'blog-mock-accessible-motion-notes',
			'blog-astro-foundation-notes',
		],
	);
	assert.deepEqual(
		filterArticleSearch(items, { kind: 'project', topicId: 'markdown' }).map((item) => item.id),
		['project-personal-web-development'],
	);
	assert.deepEqual(filterArticleSearch(items, { query: '存在しない検索語' }), []);
	assert.equal(Object.isFrozen(filterArticleSearch(items)), true);
	const portfolio = items.find((item) => item.id === 'project-personal-web-development');
	assert.equal(matchesArticleSearch(portfolio, { query: 'ポートフォリオ', topicId: 'astro' }), true);
});
