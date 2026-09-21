import assert from 'node:assert/strict';
import test from 'node:test';

import {
	defineBlogPostCollection,
	defineBlogTagCollection,
	findBlogPostBySlug,
	findBlogTagById,
	getBlogPostBySlug,
	getBlogPosts,
	getBlogPostsForTag,
	getBlogTags,
	getBlogTagsByIds,
	getRelatedBlogPosts,
	selectBlogPosts,
	selectBlogTags,
	blogPosts,
	blogTags,
} from '../src/content/blog/index.ts';
import { assertBlogTagRelations } from '../src/content/blog/relations.ts';

const validPost = Object.freeze({
	id: 'test-post',
	state: 'mock',
	order: 0,
	slug: 'test-post',
	title: 'Test post',
	description: 'Test description',
	publishedAt: '2026-01-10',
	updatedAt: '2026-01-12',
	tagIds: ['astro'],
	readingTimeMinutes: 3,
});

const validTag = Object.freeze({
	id: 'astro',
	state: 'mock',
	order: 0,
	label: 'Astro',
	description: 'Astro notes.',
});

test('blog post data is deeply frozen at its collection boundaries', () => {
	assert.equal(Object.isFrozen(blogPosts), true);

	for (const post of blogPosts) {
		assert.equal(Object.isFrozen(post), true);
		assert.equal(Object.isFrozen(post.tagIds), true);
	}
});

test('blog tags are validated, frozen, and resolved from stable ids', () => {
	assert.equal(Object.isFrozen(blogTags), true);
	assert.equal(blogTags.every(Object.isFrozen), true);
	assert.deepEqual(
		getBlogTags().map((tag) => tag.id),
		['astro', 'typescript', 'css', 'accessibility', 'design-system', 'web-development'],
	);
	assert.deepEqual(getBlogTagsByIds(['typescript', 'astro']).map((tag) => tag.label), [
		'TypeScript',
		'Astro',
	]);
	assert.equal(findBlogTagById(blogTags, 'css')?.label, 'CSS');
	assert.equal(Object.isFrozen(selectBlogTags(blogTags, { limit: 1 })), true);
	assert.deepEqual(selectBlogTags(blogTags, { limit: 0 }), []);
	assert.throws(() => getBlogTags({ limit: -1 }), /non-negative safe integer/);
	assert.throws(() => getBlogTagsByIds(['missing-tag']), /No visible blog tag/);
});

test('blog tag validation rejects empty and duplicate labels', () => {
	assert.throws(() => defineBlogTagCollection([{ ...validTag, label: ' ' }]));
	assert.throws(() =>
		defineBlogTagCollection([
			validTag,
			{ ...validTag, id: 'other-tag', label: ' astro ' },
		]),
	);
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
		{ ...validPost, tagIds: ['astro', 'astro'] },
		{ ...validPost, tagIds: ['Invalid tag'] },
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

test('blog tag relations reject broken references, state mismatches, and unused visible tags', () => {
	assert.doesNotThrow(() => assertBlogTagRelations([validPost], [validTag]));
	assert.throws(
		() => assertBlogTagRelations([{ ...validPost, tagIds: ['missing-tag'] }], [validTag]),
		/unknown tag/,
	);
	assert.throws(
		() =>
			assertBlogTagRelations(
				[{ ...validPost, state: 'published' }],
				[validTag],
			),
		/non-published tag/,
	);
	assert.throws(
		() =>
			assertBlogTagRelations(
				[validPost],
				[validTag, { ...validTag, id: 'unused-tag', label: 'Unused' }],
			),
		/no supporting post/,
	);
});

test('tag and related-post queries remain deterministic', () => {
	assert.deepEqual(
		getBlogPostsForTag('astro').map((post) => post.id),
		['mock-astro-foundation-notes'],
	);
	assert.deepEqual(
		getRelatedBlogPosts('mock-accessible-motion-notes').map((post) => post.id),
		['mock-astro-foundation-notes'],
	);
	assert.equal(Object.isFrozen(getRelatedBlogPosts('mock-accessible-motion-notes')), true);
	assert.throws(() => getRelatedBlogPosts('missing-post'), /No blog post found/);
	assert.throws(() => getRelatedBlogPosts('mock-accessible-motion-notes', -1), /non-negative/);
});
