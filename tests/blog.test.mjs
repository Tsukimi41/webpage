import assert from 'node:assert/strict';
import test from 'node:test';

import {
	defineBlogPostCollection,
	findBlogPostBySlug,
	getBlogPostBySlug,
	getBlogPosts,
	selectBlogPosts,
	blogPosts,
} from '../src/content/blog/index.ts';

const validPost = Object.freeze({
	id: 'test-post',
	state: 'mock',
	order: 0,
	slug: 'test-post',
	title: 'Test post',
	description: 'Test description',
	publishedAt: '2026-01-10',
	updatedAt: '2026-01-12',
	tags: ['Astro'],
	readingTimeMinutes: 3,
});

test('blog post data is deeply frozen at its collection boundaries', () => {
	assert.equal(Object.isFrozen(blogPosts), true);

	for (const post of blogPosts) {
		assert.equal(Object.isFrozen(post), true);
		assert.equal(Object.isFrozen(post.tags), true);
	}
});

test('blog query sorts by publication date, update date, order, then id', () => {
	const records = defineBlogPostCollection([
		validPost,
		{
			...validPost,
			id: 'older-post',
			slug: 'older-post',
			publishedAt: '2025-12-01',
			updatedAt: '2025-12-01',
		},
		{
			...validPost,
			id: 'same-date-b',
			slug: 'same-date-b',
			publishedAt: '2026-01-10',
			updatedAt: '2026-01-12',
			order: 1,
		},
	]);

	assert.deepEqual(
		selectBlogPosts(records).map((post) => post.id),
		['test-post', 'same-date-b', 'older-post'],
	);
	assert.equal(Object.isFrozen(selectBlogPosts(records)), true);
});

test('blog query supports state filtering, limits, and slug lookup', () => {
	const records = defineBlogPostCollection([
		validPost,
		{
			...validPost,
			id: 'published-post',
			slug: 'published-post',
			state: 'published',
			order: 1,
			publishedAt: '2026-02-01',
			updatedAt: '2026-02-01',
		},
		{
			...validPost,
			id: 'archived-post',
			slug: 'archived-post',
			state: 'archived',
			order: 2,
			publishedAt: '2026-03-01',
			updatedAt: '2026-03-01',
		},
	]);

	assert.deepEqual(selectBlogPosts(records, { limit: 1 }).map((post) => post.id), ['published-post']);
	assert.deepEqual(selectBlogPosts(records, { limit: 0 }), []);
	assert.deepEqual(
		selectBlogPosts(records, { states: ['published'] }).map((post) => post.id),
		['published-post'],
	);
	assert.equal(findBlogPostBySlug(records, 'published-post')?.id, 'published-post');
	assert.equal(findBlogPostBySlug(records, 'archived-post'), undefined);
	assert.equal(
		findBlogPostBySlug(records, 'archived-post', { states: ['archived'] })?.id,
		'archived-post',
	);
	assert.equal(getBlogPostBySlug('astro-foundation-notes')?.id, 'mock-astro-foundation-notes');
});

test('blog query rejects malformed slugs and limits', () => {
	for (const slug of ['', ' test-post', 'Test Post', '../test-post']) {
		assert.throws(() => findBlogPostBySlug([validPost], slug), /blog query slug/);
	}

	for (const limit of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
		assert.throws(() => getBlogPosts({ limit }), /non-negative safe integer/);
	}
});

test('blog validation rejects malformed dates, tags, reading time, and slugs', () => {
	const invalidPosts = [
		{ ...validPost, title: ' ' },
		{ ...validPost, publishedAt: '2026-02-30' },
		{ ...validPost, publishedAt: '2026/01/10' },
		{ ...validPost, updatedAt: '2025-12-31' },
		{ ...validPost, tags: ['Astro', ' astro '] },
		{ ...validPost, tags: [' '] },
		{ ...validPost, readingTimeMinutes: 0 },
		{ ...validPost, readingTimeMinutes: 1.5 },
		{ ...validPost, slug: 'Test Post' },
	];

	for (const post of invalidPosts) {
		assert.throws(() => defineBlogPostCollection([post]));
	}

	assert.throws(() =>
		defineBlogPostCollection([
			validPost,
			{ ...validPost, id: 'other-post', slug: 'test-post' },
		]),
	);
});
