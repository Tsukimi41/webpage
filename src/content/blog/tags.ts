import { defineBlogTagCollection, type BlogTagDefinition } from './tag.ts';

const blogTagDefinitions = [
	{
		id: 'astro',
		state: 'mock',
		order: 10,
		label: 'Astro',
		description: 'Astroによる静的サイト設計と実装のメモ。',
	},
	{
		id: 'typescript',
		state: 'mock',
		order: 20,
		label: 'TypeScript',
		description: '型を使ったデータ設計と安全な実装のメモ。',
	},
	{
		id: 'css',
		state: 'mock',
		order: 30,
		label: 'CSS',
		description: 'レイアウト、配色、モーション表現のメモ。',
	},
	{
		id: 'accessibility',
		state: 'mock',
		order: 40,
		label: 'アクセシビリティ',
		description: '入力方法や閲覧環境を問わず利用できる設計のメモ。',
	},
	{
		id: 'design-system',
		state: 'mock',
		order: 50,
		label: 'Design System',
		description: '一貫した見た目と変更しやすさを両立する設計のメモ。',
	},
	{
		id: 'web-development',
		state: 'mock',
		order: 60,
		label: 'Web制作',
		description: '個人サイトの設計、実装、改善を横断するメモ。',
	},
] as const satisfies readonly BlogTagDefinition[];

export const blogTags = defineBlogTagCollection(blogTagDefinitions);
