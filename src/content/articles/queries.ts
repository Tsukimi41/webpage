import { getBlogPosts } from '../blog/index.ts';
import { getProjects } from '../projects/index.ts';
import type { ContentState } from '../core/content.ts';

export type ArticleFeedKind = 'project' | 'blog';

export interface ArticleFeedItem {
	readonly id: string;
	readonly sourceId: string;
	readonly sourceKind: ArticleFeedKind;
	readonly sourceLabel: string;
	readonly state: ContentState;
	readonly title: string;
	readonly summary: string;
	readonly dateLabel: string;
	readonly href?: `/${string}`;
}

export interface ArticleFeedQuery {
	readonly states?: readonly ContentState[];
	readonly limit?: number;
}

function assertOptionalLimit(limit: number | undefined): void {
	if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 0)) {
		throw new Error(`article feed limit must be a non-negative safe integer: ${limit}`);
	}
}

function applyLimit<T>(items: readonly T[], limit: number | undefined): readonly T[] {
	assertOptionalLimit(limit);
	return Object.freeze(limit === undefined ? [...items] : items.slice(0, limit));
}

export function getArticleFeed(query: ArticleFeedQuery = {}): readonly ArticleFeedItem[] {
	const { states, limit } = query;
	const projectItems = getProjects({ states });
	const blogItems = getBlogPosts({ states });

	const items: ArticleFeedItem[] = [
		...projectItems.map((project) => ({
			id: `project-${project.id}`,
			sourceId: project.id,
			sourceKind: 'project' as const,
			sourceLabel: '活動履歴',
			state: project.state,
			title: project.title,
			summary: project.detailSections[0]?.paragraphs[0] ?? project.summary,
			dateLabel: project.period,
			href: `/projects/${project.slug}/` as `/${string}`,
		})),
		...blogItems.map((post) => ({
			id: `blog-${post.id}`,
			sourceId: post.id,
			sourceKind: 'blog' as const,
			sourceLabel: 'ブログ',
			state: post.state,
			title: post.title,
			summary: post.description,
			dateLabel: post.publishedAt.replaceAll('-', '.'),
			href: `/blog/${post.slug}/` as `/${string}`,
		})),
	];

	return applyLimit(items, limit);
}
