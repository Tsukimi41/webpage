import assert from 'node:assert/strict';
import test from 'node:test';
import { createArticleSearchCache } from '../src/scripts/article-search-cache.ts';
import { filterArticleSearch } from '../src/content/articles/search.ts';

const records = [
	{id:'one', sourceKind:'blog', searchText:'astro 日本語', topicIds:['web']},
	{id:'two', sourceKind:'project', searchText:'astro css', topicIds:['web','css']},
];

test('cache preserves filtering and reuses normalized queries across pagination', () => {
	const search = createArticleSearchCache(records);
	for (const criteria of [{}, {query:'ＡＳＴＲＯ'}, {query:'astro css'}, {kind:'blog'}, {topicId:'css'}, {query:'unknown'}]) {
		assert.deepEqual(search(criteria), filterArticleSearch(records, criteria));
	}
	assert.equal(search({query:'ＡＳＴＲＯ'}), search({query:' astro '}));
	assert.ok(Object.isFrozen(search({})));
});

test('cache is bounded and isolated to each page collection', () => {
	const search = createArticleSearchCache(records);
	const first = search({query:'astro'});
	for (let i = 0; i < 32; i++) search({query:String(i)});
	assert.notEqual(search({query:'astro'}), first);
	assert.deepEqual(search({query:'astro'}), first);
	assert.deepEqual(createArticleSearchCache([])({query:'astro'}), []);
});
