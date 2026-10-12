import {
	defineProfileDetailCollection,
	type ProfileDetailDefinition,
} from './profile-detail.ts';

const profileDetailDefinitions = [
	{
		id: 'tsukimi41-profile',
		state: 'published',
		order: 10,
		summary:
			'「さくりもよよ」「Tsukimi41」「薪」などと、ころころ変わる名前で活動している、電気通信大学の学生です。',
		biography: [
			'ロボット、組込み、画像認識、Web、最適化、OSINTなど、気になった技術に手を伸ばしています。',
			'プログラミングとの出会いは小学生の頃。Scratchで「自分の命令どおりに何かが動く」面白さと、「思ったとおりではなく、書いたとおりに動く」厳しさを知りました。当時のアカウントは消えましたが、バグを追いかける習慣だけは残っています。',
			'アメリカ滞在中は、Moreland Middle SchoolのPLTW（Project Lead The Way）というプロジェクトに参加していました。Computer ScienceコースとAutomation & Roboticsの両コースに参加し、Automation & Roboticsでは、ROBOTCを使ってVEXロボットのプログラミングに取り組みました。',
			'大学では、ROS 2を使ったロボコン、画像認識と音声合成を担当するロボット開発、配送経路最適化、Webアプリ制作、OSINT CTFなどに参加しています。養蜂、アマチュア無線、英語ディベートにも手を出してきました。一見ばらばらですが、観察して、仕組みを理解して、動く形にするという点ではだいたい同じです。',
			'これから軸にしたいのは、宇宙・セキュリティ・ロボット。知らない分野へ入り込み、必要な技術をつなぎ合わせ、地上でも宇宙でもちゃんと動くものを作れる人を目指しています。',
		],
		sections: [
			{
				id: 'achievements',
				title: '主な受賞・活動実績',
				paragraphs: [],
				items: [
					'ASE-LAB. での活動',
					'文科省・経産省協力・青梅法人会主催『省人化・省力化チャレンジプロジェクト』最優秀賞（巡の開発）',
					'F3RCロボコン大会 企業賞',
					'U☆PoC～UECアイディア実証コンテスト～2025 企業賞',
					'ソフトバンク主催 首都圏国立大学合同ハッカソン プロジェクトリーダー',
					'観光庁 観光クロスオーバーコンテスト2026 セミファイナリスト',
					'DIVER OSINT CTF 2026 世界13位（UEC OSINT CLUB）',
					'PDA Tokai Parliamentary Debate Competition 2023 優勝',
					'経済産業省主催 政策提案型パブリックディベート全国大会 全国優勝',
					'第6回全国高校教育模擬国連大会AJEMUN 優秀初心者賞',
					'第17回全日本高校模擬国連大会 本大会出場',
					'令和5年度模擬国連岐阜会議 優秀賞',
					'ALGORIプログラミングコンテスト スペシャルロジック賞',
				],
			},
			{
				id: 'qualifications',
				title: '資格・語学',
				paragraphs: [],
				items: [
					'実用英語技能検定 1級',
					'TOEIC IP 970点',
					'中国語検定4級',
					'第三級アマチュア無線技士',
				],
			},
			{
				id: 'affiliations',
				title: '主な所属・活動',
				paragraphs: [],
				items: [
					'ロボメカ工房',
					'電通大 de labo',
					'データサイエンス研究会',
					'UEC OSINT CLUB',
					'Urban Bee Club',
					'無線部',
					'サイクリング部',
					'ASE-LAB.'
				],
			},
			{
				id: 'programming-origin',
				title: 'プログラミングとの出会い',
				paragraphs: [
					'小学校の課外活動でScratchに出会いました。もうこのころのアカウントは無くなりましたが、自分で作ったものが動く面白さと、うまく動かない原因を探して直す楽しさが、今も開発の原点だと感じています。',
				],
				items: [],
			},
			{
				id: 'before-university',
				title: '海外生活と高校までの活動',
				paragraphs: [
					'マレーシアとアメリカでの海外生活を経て、帰国後もScratchでの制作を続けました。中学3年生で英語のゲーム「The Ultimate Fruit Catch」を制作し、賞を取ったのが嬉しかったのを覚えています。高校では英語ディベート、模擬国連、政策提案型パブリックディベートにも取り組みました。',
					'アメリカではMoreland Middle SchoolのPLTW（Project Lead The Way）に参加し、Computer ScienceコースとAutomation & Roboticsコースの両方を受講しました。Automation & Roboticsでは、ROBOTCを使ってVEXロボットを扱いました。',
				],
				items: [],
			},
			{
				id: 'robotics',
				title: 'ロボットとハードウェア',
				paragraphs: [
					'大学では「ロボメカ工房」でROS 2などを使ったロボット開発に参加し、F3RCでは企業賞を受賞しました。授業では、映像・動作・音声を同期させたウェルカムロボット「Yorumot」を開発したり、ドローンの自律飛行制御を学んだりしています。',
					'「電通大 de labo」では、コミュニケーションロボット「Miaou」の画像認識と音声合成を担当。3D CADによる筐体設計も学んでいます。',
					'電通大 de laboでは、犬型の四足歩行ロボットUnitree Go 2も扱いました。',
				],
				items: [],
			},
			{
				id: 'social-implementation',
				title: 'Web開発・最適化・社会実装',
				paragraphs: [
					'ReactやPythonなどで、Webアプリを開発。U☆PoC 2025では企業賞を受賞し、ソフトバンク主催のハッカソンではリーダーとしてボイスコミック制作の自動化アプリを開発しました。',
					'Small DX CHALLENGEでは、語句時のLPガス配送の経路最適化システム「巡」を開発しました。引き続き、間髪中です。現場の業務調査から、操作画面の設計まで取り組んでいます。',
				],
				items: [],
			},
			{
				id: 'security-osint',
				title: 'セキュリティとOSINT',
				paragraphs: [
					'UEC OSINT CLUBで、公開情報の収集・分析・検証に取り組んでいます。DIVER OSINT CTF 2026では、チームで世界13位となりました。',
				],
				items: [],
			},
			{
				id: 'outside-technology',
				title: 'その他の活動',
				paragraphs: [
					'Urban Bee Clubでは2026年の代表を務め、養蜂やセンサを活用した「スマート養蜂」を進めています。',
					'データサイエンス研究会では競艇予測AIの開発や数理最適化を学び、無線部では第三級アマチュア無線技士の資格を取得してコンテストで運用しました。',
				],
				items: [],
			},
			{
				id: 'future',
				title: 'これから',
				paragraphs: [
					'ロボット・組込み・通信などの経験を生かし、将来は宇宙で動くシステムの開発に携わりたいと考えています。',
				],
				items: [],
			},
		],
		interests: [],
		principles: [],
		contact: {
			label: 'お問い合わせ',
			email: 'skr.moyoyo@gmail.com',
			note: 'ご連絡はこちらのメールアドレスへお願いします。',
		},
	},
	

] as const satisfies readonly ProfileDetailDefinition[];

export const profileDetails = defineProfileDetailCollection(profileDetailDefinitions);
