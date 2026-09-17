import { defineSkillCollection, type SkillDefinition } from './skill.ts';

const skillDefinitions = [
	{
		id: 'typescript',
		state: 'mock',
		order: 10,
		label: 'TypeScript',
		category: 'language',
		summary: 'データ境界を型と実行時検証の両方で守り、変更時の不整合を早期に検出します。',
	},
	{
		id: 'astro',
		state: 'mock',
		order: 20,
		label: 'Astro',
		category: 'framework',
		summary: '静的HTMLを中心に、必要な操作だけへ小さなJavaScriptを追加します。',
	},
	{
		id: 'css',
		state: 'mock',
		order: 30,
		label: 'CSS',
		category: 'styling',
		summary: 'レスポンシブ、テーマ、動きの低減を含む堅牢な視覚表現を設計します。',
	},
	{
		id: 'markdown',
		state: 'mock',
		order: 40,
		label: 'Markdown',
		category: 'tool',
		summary: '文章と構造を表示実装から分離し、継続的に更新できる形で管理します。',
	},
	{
		id: 'github-actions',
		state: 'mock',
		order: 50,
		label: 'GitHub Actions',
		category: 'tool',
		summary: '検証を自動化し、公開前に品質上の問題を検出できる流れを組み立てます。',
	},
] as const satisfies readonly SkillDefinition[];

export const skills = defineSkillCollection(skillDefinitions);
