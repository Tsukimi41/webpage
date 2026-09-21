import {
	defineProfileDetailCollection,
	type ProfileDetailDefinition,
} from './profile-detail.ts';

const profileDetailDefinitions = [
	{
		id: 'mock-profile-details',
		state: 'mock',
		order: 10,
		summary:
			'Web技術を使って、情報の見つけやすさと触って楽しい表現を両立することに関心があります。',
		biography: [
			'学習内容を小さな制作物へ落とし込み、設計理由と検証結果を言葉に残しながら改善する進め方を試しています。',
			'画面だけでなく、データの追加方法、アクセシビリティ、表示速度まで含めて一つの制作物として考えることを大切にしています。',
		],
		interests: [
			{
				id: 'frontend-engineering',
				title: 'フロントエンド設計',
				description: '静的HTMLを土台に、必要な場所だけへ操作と動きを追加する構成に関心があります。',
			},
			{
				id: 'content-design',
				title: '情報設計',
				description: '内容が増えても探しやすく、更新時に同じ情報を重複させない構造を考えます。',
			},
			{
				id: 'creative-interaction',
				title: '遊びのある操作表現',
				description: '理解や操作を妨げず、サイトそのものを覚えてもらえるインタラクションを試します。',
			},
		],
		principles: [
			{
				id: 'evidence-first',
				title: '根拠を成果物で示す',
				description: '技術名だけでなく、使用した場所、判断、検証結果まで一緒に提示します。',
			},
			{
				id: 'progressive-enhancement',
				title: '静的な内容を先に成立させる',
				description: 'JavaScriptやアニメーションが動かなくても、主要情報とリンクを利用できる状態から作ります。',
			},
			{
				id: 'small-verifiable-steps',
				title: '小さく作って検証する',
				description: 'データ、表示、操作を確認可能な単位へ分け、意図に合うかを見直しながら進めます。',
			},
		],
		contact: {
			label: '公開用メール',
			email: 'hello@example.com',
			note: 'これは連絡導線と長い表記を確認するためのモックアドレスです。',
		},
	},
] as const satisfies readonly ProfileDetailDefinition[];

export const profileDetails = defineProfileDetailCollection(profileDetailDefinitions);
