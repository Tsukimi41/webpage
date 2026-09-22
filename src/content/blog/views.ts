import type { BlogPostDefinition } from './post.ts';
import type { BlogTagDefinition } from './tag.ts';
import { getBlogTagsByIds } from './tag-queries.ts';

export interface BlogPostView {
	readonly post: BlogPostDefinition;
	readonly tags: readonly BlogTagDefinition[];
}

export function createBlogPostView(post: BlogPostDefinition): Readonly<BlogPostView> {
	return Object.freeze({
		post,
		tags: getBlogTagsByIds(post.tagIds),
	});
}

export function createBlogPostViews(
	posts: readonly BlogPostDefinition[],
): readonly Readonly<BlogPostView>[] {
	return Object.freeze(posts.map(createBlogPostView));
}
