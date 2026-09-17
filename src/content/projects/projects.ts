import {
	assertProjectSkillReferences,
	defineProjectCollection,
	type ProjectDefinition,
} from './project.ts';
import { skills } from '../skills/skills.ts';

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
		skillIds: ['astro', 'typescript', 'css'],
		featured: true,
		links: [
			{
				id: 'demo',
				label: 'デモ',
				href: 'https://example.com/mock-learning-log',
			},
		],
		detailSections: [
			{
				id: 'challenge',
				title: '課題と目的',
				paragraphs: [
					'学習記録が複数の場所に分散し、取り組みの偏りや継続状況を振り返りにくいという想定課題から設計しました。',
				],
			},
			{
				id: 'approach',
				title: '設計と工夫',
				paragraphs: [
					'記録、分類、振り返りの流れを一画面で把握できる情報構造にし、入力の負担を増やさず傾向を確認できる構成を検討しました。',
					'表示ロジックとコンテンツデータを分離し、項目が増えてもコンポーネントを変更せず拡張できる設計を想定しています。',
				],
			},
			{
				id: 'outcome',
				title: '成果と学び',
				paragraphs: [
					'小さな記録を継続につなげるには、入力機能だけでなく、利用者が次の行動を判断できるフィードバック設計が重要だと整理しました。',
				],
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
		skillIds: ['typescript', 'astro', 'css', 'markdown', 'github-actions'],
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
				href: 'https://example.com/mock-campus-guide/article',
			},
		],
		detailSections: [
			{
				id: 'challenge',
				title: '課題と目的',
				paragraphs: [
					'履修、施設、行事などの情報が別々に管理され、必要な情報へたどり着くまでに時間がかかる状況を想定しました。',
				],
			},
			{
				id: 'approach',
				title: '設計と工夫',
				paragraphs: [
					'長い見出し、多数の技術ラベル、複数の関連リンクが存在しても読み順が崩れないよう、意味のまとまりを基準にレイアウトを設計しました。',
					'キーボード操作、文字拡大、狭い画面を同じ情報構造で支えられるよう、装飾に依存しないマークアップを優先しています。',
				],
			},
			{
				id: 'outcome',
				title: '成果と学び',
				paragraphs: [
					'情報量が増えた場合でも、見出し階層と余白の規則を揃えることで探索しやすさを維持できるという仮説を確認するためのモックです。',
				],
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
		skillIds: ['typescript'],
		featured: false,
		links: [],
		detailSections: [
			{
				id: 'challenge',
				title: '課題と目的',
				paragraphs: [
					'頻繁には使わないコマンドほど必要な場面で思い出せない、という小さな不便を素早く解消することを目的にした想定プロジェクトです。',
				],
			},
			{
				id: 'learning',
				title: '設計上の学び',
				paragraphs: [
					'機能を増やす前に検索語と利用場面を整理し、最小限の情報から目的の項目へ到達できる構造を優先しました。',
				],
			},
		],
	},
] as const satisfies readonly ProjectDefinition[];

const definedProjects = defineProjectCollection(projectDefinitions);

assertProjectSkillReferences(definedProjects, skills);

export const projects = definedProjects;
