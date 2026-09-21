import {
	PREVIEW_CONTENT_STATES,
	assertContentId,
	selectContentByState,
	type ContentState,
} from '../core/content.ts';
import { blogPosts } from './posts.ts';
import type { BlogPostDefinition } from './post.ts';
import type { BlogTagDefinition } from './tag.ts';
import { blogTags } from './tags.ts';

export interface BlogTagQuery {
	readonly states?: readonly ContentState[];
	readonly limit?: number;
}

function assertOptionalLimit(limit: number | undefined): void {
	if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 0)) {
		throw new Error(`blog tag query limit must be a non-negative safe integer: ${limit}`);
	}
}

export function selectBlogTags<T extends BlogTagDefinition>(
	records: readonly T[],
	query: BlogTagQuery = {},
): readonly T[] {
	const { states = PREVIEW_CONTENT_STATES, limit } = query;
	assertOptionalLimit(limit);
	const selectedTags = selectContentByState(records, states);

	return Object.freeze(limit === undefined ? [...selectedTags] : selectedTags.slice(0, limit));
}

export function getBlogTags(query: BlogTagQuery = {}): readonly BlogTagDefinition[] {
	return selectBlogTags(blogTags, query);
}

export function findBlogTagById<T extends BlogTagDefinition>(
	records: readonly T[],
	id: string,
	query: Pick<BlogTagQuery, 'states'> = {},
): T | undefined {
	assertContentId(id, 'blog tag query id');
	const { states = PREVIEW_CONTENT_STATES } = query;
	return selectContentByState(records, states).find((tag) => tag.id === id);
}

export function getBlogTagById(
	id: string,
	query: Pick<BlogTagQuery, 'states'> = {},
): BlogTagDefinition | undefined {
	return findBlogTagById(blogTags, id, query);
}

export function getBlogTagsByIds(
	ids: readonly string[],
	query: Pick<BlogTagQuery, 'states'> = {},
): readonly BlogTagDefinition[] {
	const tags = ids.map((id) => {
		const tag = getBlogTagById(id, query);

		if (!tag) {
			throw new Error(`No visible blog tag found for id: ${id}`);
		}

		return tag;
	});

	return Object.freeze(tags);
}

export function getBlogPostsForTag(
	tagId: string,
	query: Pick<BlogTagQuery, 'states'> = {},
): readonly BlogPostDefinition[] {
	assertContentId(tagId, 'blog tag post query id');
	const { states = PREVIEW_CONTENT_STATES } = query;

	return Object.freeze(
		selectContentByState(blogPosts, states)
			.filter((post) => post.tagIds.includes(tagId))
			.sort(
				(left, right) =>
					right.publishedAt.localeCompare(left.publishedAt) ||
					left.order - right.order ||
					left.id.localeCompare(right.id),
			),
	);
}
