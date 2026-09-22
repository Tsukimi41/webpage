import { defineBlogPostCollection, type BlogPostDefinition } from './post.ts';
import { assertBlogTagRelations } from './relations.ts';
import { blogTags } from './tags.ts';

const blogPostDefinitions = [
		{
		id: 'my-first-post',
		state: 'draft',
		order: 100,
		slug: 'my-first-post',
		title: 'はじめてのブログ記事',
		description: 'この記事で説明する内容を短くまとめます。',
		publishedAt: '2026-09-01',
		updatedAt: '2026-09-02',
		tagIds: [],
		readingTimeMinutes: 3,
	},
	{
		id: 'arch1',
		state: 'mock',
		order: 200,
		slug: 'arch1',
		title: 'Arch Linux、始めました',
		description:
			'Arch Linuxを始めようと思い立ったので、やる。',
		publishedAt: '2026-09-12',
		updatedAt: '2026-09-12',
		tagIds: [],
		readingTimeMinutes: 7,
	},
	{
		id: 'astro-foundation-notes',
		state: 'mock',
		order: 200,
		slug: 'astro-foundation-notes',
		title: 'Astroで静的サイトを組み立てるときに考えたこと',
		description:
			'静的HTMLを中心にしながら、必要な場所だけへインタラクションを足す構成を整理した技術メモ。',
		publishedAt: '2026-04-18',
		updatedAt: '2026-04-20',
		tagIds: ['astro', 'typescript', 'web-development'],
		readingTimeMinutes: 4,
	},
	{
		id: 'mock-accessible-motion-notes',
		state: 'mock',
		order: 300,
		slug: 'accessible-motion-notes',
		title: '動きの楽しさと読みやすさを両立するためのモーション設計メモ',
		description:
			'CSSアニメーションの役割を情報理解と操作への反応に分け、動きを減らす設定でも内容を保つ考え方をまとめた架空記事です。',
		publishedAt: '2026-05-12',
		updatedAt: '2026-05-12',
		tagIds: ['css', 'accessibility', 'design-system', 'web-development'],
		readingTimeMinutes: 7,
	},
	{
		id: 'mock-command-notes',
		state: 'mock',
		order: 400,
		slug: 'command-notes',
		title: '短く残して、あとで見つけるコマンド備忘録',
		description:
			'日々の開発で使う小さな知識を、あとから探しやすい形で残すための架空の備忘録です。',
		publishedAt: '2026-05-12',
		updatedAt: '2026-05-18',
		tagIds: [],
		readingTimeMinutes: 2,
	},
] as const satisfies readonly BlogPostDefinition[];

export const blogPosts = defineBlogPostCollection(blogPostDefinitions);

assertBlogTagRelations(blogPosts, blogTags);
