import { defineProjectCollection, type ProjectDefinition } from './project.ts';

const projectDefinitions = [
	{
		id: 'mock-learning-log',
		state: 'mock',
		order: 10,
		slug: 'learning-log',
		title: '架空の学習ログ可視化ツール',
		summary: '日々の学習記録を分野ごとに整理し、振り返りやすくする架空のWebツールです。',
		period: '20XX年',
		role: '要件整理、設計、フロントエンド実装',
		technologyLabels: ['Astro', 'TypeScript', 'CSS'],
		featured: true,
		links: [
			{
				id: 'demo',
				label: 'デモ',
				href: 'https://example.com/mock-learning-log',
			},
		],
	},
	{
		id: 'mock-campus-guide',
		state: 'mock',
		order: 20,
		slug: 'campus-guide',
		title: '架空のキャンパス生活を支える情報整理・共有プラットフォーム',
		summary: '長い名称や複数の技術項目を含むカード表示を確認するための架空プロジェクトです。',
		period: '20XX年4月〜20XX年9月',
		role: '情報設計、アクセシビリティ設計、UI実装、品質確認',
		technologyLabels: ['TypeScript', 'Astro', 'CSS', 'Markdown', 'GitHub Actions'],
		featured: true,
		links: [
			{
				id: 'repository',
				label: 'ソースコード',
				href: 'https://example.com/mock-campus-guide',
			},
			{
				id: 'article',
				label: '関連記事',
				href: '/blog/mock-campus-guide',
			},
		],
	},
	{
		id: 'mock-command-notes',
		state: 'mock',
		order: 30,
		slug: 'command-notes',
		title: '架空のコマンド備忘録',
		summary: '任意の関連リンクがない場合を確認するための架空プロジェクトです。',
		period: '20XX年',
		role: '設計、実装',
		technologyLabels: ['TypeScript'],
		featured: false,
		links: [],
	},
] as const satisfies readonly ProjectDefinition[];

export const projects = defineProjectCollection(projectDefinitions);
