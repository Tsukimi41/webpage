import assert from 'node:assert/strict';
import test from 'node:test';

import { getArticleFeed } from '../src/content/articles/index.ts';

test('article feed combines project details and blog posts without duplicating their source data', () => {
	const items = getArticleFeed();

	assert.equal(items.length, 6);
	assert.deepEqual(
		items.map((item) => item.sourceKind),
		['project', 'project', 'project', 'blog', 'blog', 'blog'],
	);
	assert.equal(items.every((item) => item.href), true);
	assert.equal(
		items.filter((item) => item.sourceKind === 'blog').every((item) => item.href?.startsWith('/blog/')),
		true,
	);
	assert.equal(items.some((item) => item.summary.length > 0), true);
	assert.equal(Object.isFrozen(items), true);
});

test('article feed supports state filtering and a deterministic limit', () => {
	assert.deepEqual(
		getArticleFeed({ states: ['published'] }),
		[],
	);
	assert.deepEqual(
		getArticleFeed({ limit: 2 }).map((item) => item.id),
		['project-mock-learning-log', 'project-mock-campus-guide'],
	);
	assert.deepEqual(getArticleFeed({ limit: 0 }), []);
	assert.throws(() => getArticleFeed({ limit: -1 }), /non-negative safe integer/);
	assert.throws(() => getArticleFeed({ limit: 1.5 }), /non-negative safe integer/);
});
