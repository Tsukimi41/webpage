import { blogTags, getBlogPosts } from '../blog/index.ts';
import { getProjects } from '../projects/index.ts';
import { skills } from '../skills/index.ts';
import type { ContentState } from '../core/content.ts';
import { normalizeArticleSearchText, type ArticleSearchRecord } from './search.ts';

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
	readonly href: `/${string}`;
}

export interface ArticleIndexItem extends ArticleFeedItem, ArticleSearchRecord {
	readonly topicLabels: readonly string[];
}

export interface ArticleTopicFacet {
	readonly id: string;
	readonly label: string;
	readonly count: number;
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

function createArticleIndex(query: Pick<ArticleFeedQuery, 'states'> = {}): readonly ArticleIndexItem[] {
	const { states } = query;
	const projectItems = getProjects({ states });
	const blogItems = getBlogPosts({ states });
	const skillsById = new Map(skills.map((skill) => [skill.id, skill]));
	const tagsById = new Map(blogTags.map((tag) => [tag.id, tag]));

	return Object.freeze([
		...projectItems.map((project) => {
			const topicLabels = project.skillIds.map((skillId) => {
				const skill = skillsById.get(skillId);

				if (!skill) {
					throw new Error(`Article index cannot resolve project skill: ${skillId}`);
				}

				return skill.label;
			});
			const summary = project.detailSections[0]?.paragraphs[0] ?? project.summary;
			const searchText = normalizeArticleSearchText([
				project.title,
				project.summary,
				project.period,
				...topicLabels,
				...project.detailSections.flatMap((section) => [section.title, ...section.paragraphs]),
			].join(' '));

			return Object.freeze({
				id: `project-${project.id}`,
				sourceId: project.id,
				sourceKind: 'project' as const,
				sourceLabel: 'プロジェクト',
				state: project.state,
				title: project.title,
				summary,
				dateLabel: project.period,
				href: `/projects/${project.slug}/` as `/${string}`,
				topicIds: Object.freeze([...project.skillIds]),
				topicLabels: Object.freeze(topicLabels),
				searchText,
			});
		}),
		...blogItems.map((post) => {
			const topicLabels = post.tagIds.map((tagId) => {
				const tag = tagsById.get(tagId);

				if (!tag) {
					throw new Error(`Article index cannot resolve blog tag: ${tagId}`);
				}

				return tag.label;
			});
			const dateLabel = post.updatedAt.replaceAll('-', '.');
			const searchText = normalizeArticleSearchText([
				post.title,
				post.description,
				post.publishedAt,
				post.updatedAt,
				dateLabel,
				...topicLabels,
			].join(' '));

			return Object.freeze({
				id: `blog-${post.id}`,
				sourceId: post.id,
				sourceKind: 'blog' as const,
				sourceLabel: '記事',
				state: post.state,
				title: post.title,
				summary: post.description,
				dateLabel,
				href: `/articles/${post.slug}/` as `/${string}`,
				topicIds: Object.freeze([...post.tagIds]),
				topicLabels: Object.freeze(topicLabels),
				searchText,
			});
		}),
	]);
}

export function getArticleIndex(query: ArticleFeedQuery = {}): readonly ArticleIndexItem[] {
	return applyLimit(createArticleIndex(query), query.limit);
}

export function getArticleTopics(
	items: readonly ArticleIndexItem[],
): readonly Readonly<ArticleTopicFacet>[] {
	const topics = new Map<string, { label: string; count: number }>();

	for (const item of items) {
		item.topicIds.forEach((id, index) => {
			const label = item.topicLabels[index];

			if (!label) {
				throw new Error(`Article topic ${id} is missing its label.`);
			}

			const currentTopic = topics.get(id);

			if (currentTopic && currentTopic.label !== label) {
				throw new Error(`Article topic ${id} has inconsistent labels.`);
			}

			topics.set(id, { label, count: (currentTopic?.count ?? 0) + 1 });
		});
	}

	return Object.freeze(
		[...topics.entries()]
			.map(([id, topic]) => Object.freeze({ id, ...topic }))
			.sort((left, right) => left.label.localeCompare(right.label, 'ja') || left.id.localeCompare(right.id)),
	);
}

export function getArticleFeed(query: ArticleFeedQuery = {}): readonly ArticleFeedItem[] {
	return Object.freeze(
		getArticleIndex(query).map(({ topicIds: _topicIds, topicLabels: _topicLabels, searchText: _searchText, ...item }) =>
			Object.freeze(item),
		),
	);
}
