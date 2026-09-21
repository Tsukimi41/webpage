import {
	assertContentId,
	PREVIEW_CONTENT_STATES,
	selectContentByState,
	type ContentState,
} from '../core/content.ts';
import type { BlogPostDefinition } from './post.ts';
import { blogPosts } from './posts.ts';

export interface BlogQuery {
	readonly states?: readonly ContentState[];
	readonly limit?: number;
}

function assertOptionalLimit(limit: number | undefined): void {
	if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 0)) {
		throw new Error(`blog query limit must be a non-negative safe integer: ${limit}`);
	}
}

function sortBlogPosts<T extends BlogPostDefinition>(records: readonly T[]): readonly T[] {
	return Object.freeze(
		[...records].sort(
			(left, right) =>
				right.publishedAt.localeCompare(left.publishedAt) ||
				right.updatedAt.localeCompare(left.updatedAt) ||
				left.order - right.order ||
				left.id.localeCompare(right.id),
		),
	);
}

function applyLimit<T>(records: readonly T[], limit: number | undefined): readonly T[] {
	assertOptionalLimit(limit);
	return Object.freeze(limit === undefined ? [...records] : records.slice(0, limit));
}

export function selectBlogPosts<T extends BlogPostDefinition>(
	records: readonly T[],
	query: BlogQuery = {},
): readonly T[] {
	const { states = PREVIEW_CONTENT_STATES, limit } = query;
	const selectedPosts = sortBlogPosts(selectContentByState(records, states));

	return applyLimit(selectedPosts, limit);
}

export function getBlogPosts(query: BlogQuery = {}): readonly BlogPostDefinition[] {
	return selectBlogPosts(blogPosts, query);
}

export function findBlogPostBySlug<T extends BlogPostDefinition>(
	records: readonly T[],
	slug: string,
	query: Pick<BlogQuery, 'states'> = {},
): T | undefined {
	assertContentId(slug, 'blog query slug');

	const { states = PREVIEW_CONTENT_STATES } = query;
	return selectBlogPosts(records, { states }).find((post) => post.slug === slug);
}

export function getBlogPostBySlug(
	slug: string,
	query: Pick<BlogQuery, 'states'> = {},
): BlogPostDefinition | undefined {
	return findBlogPostBySlug(blogPosts, slug, query);
}
