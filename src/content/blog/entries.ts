import type { MarkdownInstance } from 'astro';
import { assertContentId } from '../core/content.ts';
import type { BlogPostDefinition } from './post.ts';

interface BlogEntryFrontmatter {
	readonly sourceId: string;
}

export type BlogMarkdownEntry = MarkdownInstance<BlogEntryFrontmatter>;

const entryModules = import.meta.glob<BlogMarkdownEntry>('./entries/*.md', {
	eager: true,
});

function getEntrySlug(path: string): string {
	const fileName = path.split('/').at(-1);

	if (!fileName?.endsWith('.md')) {
		throw new Error(`Blog entry path must end with .md: ${path}`);
	}

	return fileName.slice(0, -3);
}

export function createBlogEntryIndex(
	posts: readonly BlogPostDefinition[],
	entries: Readonly<Record<string, BlogMarkdownEntry>> = entryModules,
): ReadonlyMap<string, BlogMarkdownEntry> {
	const postsById = new Map(posts.map((post) => [post.id, post]));
	const entriesBySourceId = new Map<string, BlogMarkdownEntry>();

	for (const [path, entry] of Object.entries(entries)) {
		const sourceId = entry.frontmatter.sourceId;
		assertContentId(sourceId, `${path} frontmatter.sourceId`);

		const post = postsById.get(sourceId);

		if (!post) {
			throw new Error(`Blog entry ${path} references an unknown post: ${sourceId}`);
		}

		if (getEntrySlug(path) !== post.slug) {
			throw new Error(`Blog entry filename must match post slug: ${post.slug}.md`);
		}

		if (entriesBySourceId.has(sourceId)) {
			throw new Error(`Multiple blog entries reference the same post: ${sourceId}`);
		}

		entriesBySourceId.set(sourceId, entry);
	}

	for (const post of posts) {
		if (!entriesBySourceId.has(post.id)) {
			throw new Error(`Blog post has no Markdown entry: ${post.id}`);
		}
	}

	return entriesBySourceId;
}

export function getBlogEntry(
	post: BlogPostDefinition,
	posts: readonly BlogPostDefinition[],
): BlogMarkdownEntry {
	const entry = createBlogEntryIndex(posts).get(post.id);

	if (!entry) {
		throw new Error(`Blog post has no Markdown entry: ${post.id}`);
	}

	return entry;
}
