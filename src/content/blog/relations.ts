import type { ContentState } from '../core/content.ts';
import type { BlogPostDefinition } from './post.ts';
import type { BlogTagDefinition } from './tag.ts';

const VISIBLE_STATES = new Set<ContentState>(['mock', 'draft', 'published']);

export function assertBlogTagRelations(
	posts: readonly BlogPostDefinition[],
	tags: readonly BlogTagDefinition[],
): void {
	const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
	const referencedTagIds = new Set<string>();

	for (const post of posts) {
		for (const tagId of post.tagIds) {
			const tag = tagsById.get(tagId);

			if (!tag) {
				throw new Error(`Blog post ${post.id} references an unknown tag: ${tagId}`);
			}

			if (post.state === 'published' && tag.state !== 'published') {
				throw new Error(`Published blog post ${post.id} references a non-published tag: ${tagId}`);
			}

			referencedTagIds.add(tagId);
		}
	}

	for (const tag of tags) {
		if (VISIBLE_STATES.has(tag.state) && !referencedTagIds.has(tag.id)) {
			throw new Error(`Visible blog tag has no supporting post: ${tag.id}`);
		}
	}
}
