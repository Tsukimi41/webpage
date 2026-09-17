import { projects } from '../projects/projects.ts';
import {
	assertTimelineProjectReferences,
	defineTimelineCollection,
	type TimelineEntryDefinition,
} from './timeline-entry.ts';

const timelineDefinitions = [
	{
		id: 'mock-web-foundation',
		state: 'mock',
		order: 10,
		date: { year: 2024, month: 4 },
		title: '架空のWeb制作基礎学習を開始',
		description: '意味のあるHTML、レスポンシブCSS、アクセシビリティの基礎を段階的に学んだ想定記録です。',
		category: 'education',
		projectIds: [],
	},
	{
		id: 'mock-command-notes-release',
		state: 'mock',
		order: 20,
		date: { year: 2024, month: 10 },
		title: '架空のコマンド備忘録を制作',
		description: '小さな不便を題材に、検索しやすい情報構造と静的生成を試した想定プロジェクトです。',
		category: 'project',
		projectIds: ['mock-command-notes'],
	},
	{
		id: 'mock-campus-event',
		state: 'mock',
		order: 30,
		date: { year: 2025, month: 5 },
		title: '架空の学内開発イベントへ参加',
		description: '限られた時間で課題を整理し、役割分担と短い検証サイクルを経験した想定記録です。',
		category: 'event',
		projectIds: [],
	},
	{
		id: 'mock-campus-guide-release',
		state: 'mock',
		order: 40,
		date: { year: 2025, month: 9 },
		title: '架空のキャンパス情報共有基盤を設計',
		description: '情報量が増えても探索しやすい構造と、複数の入力方法へ耐えるUIを検討した想定記録です。',
		category: 'project',
		projectIds: ['mock-campus-guide'],
	},
	{
		id: 'mock-learning-log-release',
		state: 'mock',
		order: 50,
		date: { year: 2026 },
		title: '架空の学習ログ可視化ツールを設計',
		description: '記録を蓄積するだけでなく、次の学習行動へつながる振り返り体験を設計した想定記録です。',
		category: 'project',
		projectIds: ['mock-learning-log'],
	},
] as const satisfies readonly TimelineEntryDefinition[];

const definedTimeline = defineTimelineCollection(timelineDefinitions);
assertTimelineProjectReferences(definedTimeline, projects);

export const timelineEntries = definedTimeline;
