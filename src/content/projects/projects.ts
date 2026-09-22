import {
	assertProjectSkillReferences,
	defineProjectCollection,
	type ProjectDefinition,
} from './project.ts';
import { skills } from '../skills/skills.ts';

const projectDefinitions = [
	{
		id: 'scratch-first-programming',
		state: 'published',
		order: 10,
		slug: 'scratch-first-programming',
		title: 'Scratchで始めたプログラミング',
		summary: '自分の命令でキャラクターが動く面白さと、プログラムは「書いたとおりに動く」という原則を知った最初の経験です。',
		period: '小学生',
		skillIds: [],
		featured: false,
		links: [],
		detailSections: [
			{
				id: 'beginning',
				title: 'きっかけ',
				paragraphs: [
					'St. Christopher’s International Primary SchoolのAfter School Activityで、Scratchを使ったプログラミングに取り組みました。',
					'ブロックを組み合わせると、自分が考えた命令に従って画面上のキャラクターが動く。その分かりやすい反応が面白く、時間を忘れて作品を作っていました。',
				],
			},
			{
				id: 'lesson',
				title: '最初に学んだこと',
				paragraphs: [
					'自分では正しく作ったつもりでも、期待した動きにならないことが何度もありました。原因を追うと、コンピュータは間違えたのではなく、与えられた命令を正確に実行していました。',
					'「プログラムは思ったとおりではなく、書いたとおりに動く」という感覚は、この頃の試行錯誤から身につきました。当時のアカウントは残っていませんが、バグを追いかける習慣は今も残っています。',
				],
			},
		],
	},
	{
		id: 'international-life',
		state: 'published',
		order: 20,
		slug: 'international-life',
		title: 'マレーシアとアメリカでの生活',
		summary: '小学4年生からマレーシアとアメリカで暮らし、言語や文化、前提の異なる環境で物事を見る経験を積みました。',
		period: '小学4年生〜中学2年生',
		skillIds: [],
		featured: false,
		links: [],
		detailSections: [
			{
				id: 'experience',
				title: '海外での生活',
				paragraphs: [
					'小学4年生から約5年半をマレーシアで、小学6年生から中学2年生までの約2年間をアメリカで過ごしました。',
					'異なる言語や文化の中では、自分にとって当然のことが相手には当然ではありません。伝え方を変えたり、相手の背景を考えたりする必要がありました。',
				],
			},
			{
				id: 'perspective',
				title: '現在につながる視点',
				paragraphs: [
					'同じ情報でも、立場や背景によって受け取り方が変わることを学びました。',
					'技術を作るときにも、使う人や環境を一つに決めつけず、複数の視点から考える姿勢につながっています。',
				],
			},
		],
	},
	{
		id: 'ultimate-fruit-catch',
		state: 'published',
		order: 30,
		slug: 'ultimate-fruit-catch',
		title: 'The Ultimate Fruit Catch',
		summary: '海外のプレイヤーを想定し、英語の画面、加速操作、スコア、スキン解放、BGMや効果音まで作り込んだScratchゲームです。',
		period: '中学3年生',
		skillIds: [],
		featured: false,
		links: [],
		detailSections: [
			{
				id: 'concept',
				title: '作品の狙い',
				paragraphs: [
					'大垣市情報工房での活動を通して、Scratchによる作品制作を続けました。中学3年生のときに制作したのが「The Ultimate Fruit Catch」です。',
					'海外の人にも遊んでもらえるよう、説明や画面表示を英語で作りました。方向キーによる移動に加え、スペースキーを押すと数秒間加速できる仕組みを実装しました。',
				],
			},
			{
				id: 'experience-design',
				title: '遊び続けたくなる工夫',
				paragraphs: [
					'一定のスコアを超えるとゲームクリアとなり、新しいスキンが使える構成にしました。',
					'ゲームの仕組みだけでなく、カラフルなスタート画面、BGM、効果音など、遊ぶ人が受け取る体験全体を意識した最初期の作品です。',
				],
			},
		],
	},
	{
		id: 'debate-and-model-un',
		state: 'published',
		order: 40,
		slug: 'debate-and-model-un',
		title: '英語ディベート・模擬国連・政策提案',
		summary: '異なる立場の資料を調べ、論点を組み立て、限られた時間で相手へ伝える活動に取り組みました。',
		period: '高校時代・2023年',
		skillIds: ['latex'],
		featured: false,
		links: [],
		detailSections: [
			{
				id: 'activities',
				title: '取り組んだ活動',
				paragraphs: [
					'英語ディベート、模擬国連、政策提案型パブリックディベートに継続して参加しました。テーマを調査し、立場ごとの利害を整理し、議論として成立する形へまとめました。',
					'PDA Tokai Parliamentary Debate Competition in 2023と、経済産業省主催の政策提案型パブリックディベート大会で優勝しました。模擬国連では全国大会への出場や複数の賞を経験しました。',
				],
			},
			{
				id: 'learning',
				title: '技術活動へのつながり',
				paragraphs: [
					'情報を集めるだけでなく、出所を確かめ、反対意見を想定し、根拠を筋道立てて示す必要がありました。',
					'ここで培った調査と説明の力は、現在のOSINT、技術発表、チーム開発での合意形成にもつながっています。',
				],
			},
		],
	},
	{
		id: 'robomech-f3rc',
		state: 'published',
		order: 50,
		slug: 'robomech-f3rc',
		title: 'ロボメカ工房・F3RCへの挑戦',
		summary: '大学入学後からロボコン開発へ参加し、C言語、Raspberry Pi、ROS 2を使った実機開発で企業賞を受賞しました。',
		period: '2025年・大学1年次',
		skillIds: ['ros-2', 'c', 'cpp', 'github', 'ubuntu', 'amt-viewpoint'],
		featured: true,
		links: [],
		detailSections: [
			{
				id: 'start',
				title: 'ロボティクスへの入口',
				paragraphs: [
					'ロボティクスとROS 2の学習は、電気通信大学への入学後から本格的に始めました。ロボコンに取り組むロボメカ工房へ入り、入部直後から実機開発に参加しました。',
					'画面内で完結するソフトウェアとは異なり、センサの誤差、通信、電源、機械的な状態など、現実世界の条件を考えながら動作を作る必要がありました。',
				],
			},
			{
				id: 'development',
				title: '開発と役割',
				paragraphs: [
					'C言語、Raspberry Pi、ROS 2などを使い、ロボットを構成する機器とソフトウェアをつなぐ開発に携わりました。',
					'コードを書くことに加え、Robomech-NHKのGitHub Organization管理など、チームで継続して開発するための環境整備にも関わっています。',
				],
			},
			{
				id: 'result',
				title: '結果と学び',
				paragraphs: [
					'F3RCでは企業賞を受賞しました。',
					'ロボットは個々の部品が動くだけでは完成しません。機械、回路、制御、認識を一つのシステムとして統合する面白さを知った活動です。',
				],
			},
		],
	},
	{
		id: 'yorumot',
		state: 'published',
		order: 60,
		slug: 'yorumot',
		title: 'ウェルカムロボット「Yorumot」',
		summary: '3Dホログラム、人物認識、生成AI、音声合成、モーター駆動を同期させた、視覚と動きを持つウェルカムロボットです。',
		period: '2025年・大学1年次',
		skillIds: ['python', 'godot', 'voicevox', 'mixamo', 'vroid-studio-2-8-0'],
		featured: true,
		links: [],
		detailSections: [
			{
				id: 'concept',
				title: 'コンセプト',
				paragraphs: [
					'電子工学工房の授業で、来訪者へ反応するウェルカムロボット「Yorumot」を開発しました。',
					'画面にキャラクターを表示するだけでなく、3Dホログラムとして見せ、物理的なモーター駆動と音声を同期させることで、そこに存在しているように感じられる表現を目指しました。',
				],
			},
			{
				id: 'integration',
				title: 'ハードウェアとソフトウェアの統合',
				paragraphs: [
					'Godot 4、Raspberry Pi、MediaPipe、Gemini APIなどを組み合わせ、人物の検出、応答生成、アニメーション、音声合成、モーター動作を連携させました。',
					'異なる処理のタイミングを揃え、利用者から一つのロボットとして見えるようにまとめる部分に、統合システムならではの難しさがありました。',
				],
			},
			{
				id: 'learning',
				title: '学んだこと',
				paragraphs: ['AI、3D表現、音声、機構は、それぞれ単独では違う技術です。目的から逆算して組み合わせることで、新しい体験を作れることを学びました。'],
			},
		],
	},
	{
		id: 'embedded-system-practice',
		state: 'published',
		order: 70,
		slug: 'embedded-system-practice',
		title: 'マイコン・センサ・モーターの組込み開発',
		summary: 'STM32やRaspberry Pi Pico 2 Wと各種センサを使い、現実の状態を読み取り、装置を制御する組込みシステムを学びました。',
		period: '2025年〜現在',
		skillIds: ['c', 'cpp', 'raspberry-pi-pico-2-w', 'lapis-lexide', 'amt-viewpoint'],
		featured: false,
		links: [],
		detailSections: [
			{
				id: 'practice',
				title: '取り組み',
				paragraphs: [
					'STM32、Raspberry Pi Pico 2 W、センサ、モーターなどを組み合わせ、入力された値に応じて装置を動かす組込み開発に取り組みました。',
					'C/C++による制御だけでなく、開発環境の構築、デバイス設定、通信、実機での状態確認までを一つの流れとして経験しています。',
				],
			},
			{
				id: 'debugging',
				title: '実機デバッグ',
				paragraphs: ['実機では、コード以外にも配線、電源、センサ値、機構、タイミングなどが不具合の原因になります。観測できる情報を増やし、原因の範囲を一つずつ狭めていく方法を学びました。'],
			},
		],
	},
	{
		id: 'team411-upoc',
		state: 'published',
		order: 80,
		slug: 'team411-upoc',
		title: 'team411・U☆PoC企業賞',
		summary: 'アイデアを試作へ落とし込み、利用場面と実現方法をまとめて発表したチームプロジェクトです。',
		period: '2025年',
		skillIds: ['github', 'python', 'typescript'],
		featured: true,
		links: [],
		detailSections: [
			{
				id: 'challenge',
				title: 'アイデアの実証',
				paragraphs: [
					'team411として「U☆PoC～UECアイディア実証コンテスト～2025」へ参加しました。',
					'思いつきを説明するだけでなく、誰のどのような課題を解決するのかを整理し、技術的に試せる形まで具体化しました。',
				],
			},
			{
				id: 'result',
				title: '企業賞',
				paragraphs: [
					'チームでの提案と実証が評価され、企業賞を受賞しました。',
					'技術の新しさだけでなく、使う場面や価値を伝えることの重要性を学びました。',
				],
			},
		],
	},
	{
		id: 'voice-comic-hackathon',
		state: 'published',
		order: 90,
		slug: 'voice-comic-hackathon',
		title: 'ボイスコミック制作自動化アプリ',
		summary: '首都圏国立大学合同ハッカソンでプロジェクトリーダーを務め、ボイスコミック制作の工程を自動化しました。',
		period: '2025年・大学1年次',
		skillIds: ['python', 'node-js', 'typescript', 'voicevox'],
		featured: true,
		links: [],
		detailSections: [
			{
				id: 'goal',
				title: '目標',
				paragraphs: [
					'ソフトバンク主催の首都圏国立大学合同ハッカソンに参加し、画像や台詞からボイスコミックを作る工程の自動化に取り組みました。',
					'複数の処理をつなぎ、人が手作業で行っていた工程を、アプリ上の一連の操作として実行できる形を目指しました。',
				],
			},
			{
				id: 'leadership',
				title: 'プロジェクトリーダー',
				paragraphs: [
					'プロジェクトリーダーとして、機能の優先順位、担当の分担、進捗確認、最終発表を含むチーム全体の進行を担当しました。',
					'限られた期間で完成させるため、理想の機能をすべて作るのではなく、体験の中心となる処理から実装する判断を重ねました。',
				],
			},
		],
	},
	{
		id: 'personal-web-development',
		state: 'published',
		order: 100,
		slug: 'personal-web-development',
		title: 'Webアプリとポートフォリオの個人開発',
		summary: '数独ソルバー、ランニングルート生成、Webクローラー、このポートフォリオなどを通して、Web開発の範囲を広げています。',
		period: '2025年〜現在',
		skillIds: [
			'arch-linux', 'github', 'python', 'node-js', 'docker', 'vite', 'typescript', 'html',
			'css', 'wsl-2', 'ubuntu', 'xampp-control-panel', 'astro', 'markdown', 'github-actions',
			'vercel',
		],
		featured: true,
		links: [],
		detailSections: [
			{
				id: 'applications',
				title: '作ってきたもの',
				paragraphs: [
					'React、Node.js、TypeScript、Pythonなどを使い、数独ソルバー、指定距離をもとにしたランニングルート生成アプリ、Webクローラーなどを自主開発しました。',
					'既存Webサイトの改善、保守、新機能の実装にも携わり、ゼロから作る場合と、すでに動いているシステムを安全に変更する場合の両方を経験しています。',
				],
			},
			{
				id: 'portfolio',
				title: 'このポートフォリオ',
				paragraphs: [
					'このサイトはAstroとTypeScriptを中心に構築しています。プロフィール、スキル、記事、プロジェクトを型付きデータとして分け、内容が増えても更新しやすい構成にしています。',
					'レスポンシブ表示、キーボード操作、アニメーション低減、公開前検証、GitHub Actionsによる継続的なチェックなど、表示以外の品質も制作物の一部として扱っています。',
				],
			},
			{
				id: 'environment',
				title: '開発環境',
				paragraphs: ['WindowsとWSL 2、Ubuntu、Arch Linuxを用途に応じて使い分けています。Dockerや各種Web開発ツールを使い、依存関係と実行環境を再現できる形に整えることを意識しています。'],
			},
		],
	},
	{
		id: 'meguru-route-optimization',
		state: 'published',
		order: 110,
		slug: 'meguru-route-optimization',
		title: 'LPガス配送経路最適化システム「巡」',
		summary: 'Small DX CHALLENGEで学生チームを率い、現場調査からアルゴリズム、操作画面、導入方法まで設計した配送支援システムです。',
		period: '2026年・大学2年次',
		skillIds: ['python', 'node-js', 'typescript', 'github', 'docker'],
		featured: true,
		links: [],
		detailSections: [
			{
				id: 'problem',
				title: '現場から始める',
				paragraphs: [
					'Small DX CHALLENGEで学生チームのプロジェクトリーダーを務め、西多摩地域の中小企業が抱えるLPガス配送の課題に取り組みました。',
					'最初から作るものを決めるのではなく、実際の配送業務、判断の基準、紙や既存システムの使われ方を調べ、どこに負担があるのかを整理しました。',
				],
			},
			{
				id: 'system',
				title: '「巡」の設計',
				paragraphs: [
					'配送先や条件をもとに経路を計算し、日々の配送計画を支援するシステム「巡」を開発しました。',
					'最適化アルゴリズムの結果を出すだけでなく、利用者が結果を確認し、必要に応じて判断を加えられる操作画面を設計しました。',
				],
			},
			{
				id: 'leadership',
				title: '社会実装とチーム運営',
				paragraphs: [
					'技術、利用者、企業との調整を同時に進める必要がありました。チーム内の開発をまとめるとともに、導入後に継続して使える方法まで検討しています。',
					'動く試作品を作るだけでなく、現実の業務へ入るところまで考える経験になりました。',
				],
			},
		],
	},
	{
		id: 'miaou-robot',
		state: 'published',
		order: 120,
		slug: 'miaou-robot',
		title: 'コミュニケーションロボット「Miaou」',
		summary: 'Jetson Orin Nano、Nucleo、Kachakaを連携させるロボットで、画像認識と音声合成を担当しています。',
		period: '2026年〜現在・大学2年次',
		skillIds: ['ros-2', 'python', 'c', 'cpp', 'opencv', 'solidworks', 'voicevox', 'ubuntu'],
		featured: true,
		links: [],
		detailSections: [
			{
				id: 'architecture',
				title: 'ロボットの構成',
				paragraphs: [
					'「電通大 de labo」で、コミュニケーションロボット「Miaou」の開発に参加しています。',
					'Jetson Orin Nanoによる「考える脳」、Nucleoによる「反射神経」、自律移動プラットフォームKachakaとの連携を組み合わせ、認識、判断、移動、表現を分担する構成です。',
				],
			},
			{
				id: 'responsibility',
				title: '担当',
				paragraphs: [
					'主にカメラを用いた画像認識と、利用者へ応答するための音声合成を担当しています。',
					'認識結果をロボットの行動へつなぎ、動きと声が別々に見えないよう、システム全体の流れを意識して開発しています。',
				],
			},
			{
				id: 'hardware-design',
				title: '3D CADと外観設計',
				paragraphs: ['ソフトウェアだけでなく、3D CADを使った顔部分の設計にも取り組んでいます。内部の部品配置と、利用者から見た表情の両方を考える経験を積んでいます。'],
			},
		],
	},
	{
		id: 'drone-programming',
		state: 'published',
		order: 130,
		slug: 'drone-programming',
		title: 'ドローンプログラミング',
		summary: '情報工学工房で、飛行する機体の制御とカメラ情報の利用を学び、移動ロボットへの理解を広げています。',
		period: '2026年〜現在・大学2年次',
		skillIds: ['ros-2', 'python', 'opencv', 'aruco-marker'],
		featured: true,
		links: [],
		detailSections: [
			{
				id: 'theme',
				title: '飛行するロボット',
				paragraphs: [
					'情報工学工房の「ドローンプログラミング」テーマに配属され、制御技術を学んでいます。',
					'地上を走るロボットとは異なり、姿勢や高度を保ちながら三次元空間を移動する必要があります。小さな制御のずれが機体全体の動きへ影響します。',
				],
			},
			{
				id: 'perception',
				title: '認識と制御をつなぐ',
				paragraphs: [
					'カメラ画像やマーカーから周囲の状態と位置を読み取り、その結果を飛行制御へつなげる方法に取り組んでいます。',
					'画像認識だけ、制御だけで終わらせず、認識した情報によって実際の機体がどう動くかまでを一つの問題として扱っています。',
				],
			},
		],
	},
	{
		id: 'data-science-optimization',
		state: 'published',
		order: 140,
		slug: 'data-science-optimization',
		title: 'データサイエンスと数理最適化',
		summary: '競艇予測AIの開発と数理最適化の勉強会を通じて、データから予測や意思決定へつなげる方法を学んでいます。',
		period: '2026年〜現在',
		skillIds: ['python', 'matlab'],
		featured: false,
		links: [],
		detailSections: [
			{
				id: 'prediction',
				title: '競艇予測AI',
				paragraphs: [
					'データサイエンス研究会で、過去のデータを用いた競艇予測AIの開発に参加しています。',
					'利用できるデータを整理し、予測に使う特徴を検討し、結果を評価する一連の流れを実践しています。',
				],
			},
			{
				id: 'optimization',
				title: '数理最適化',
				paragraphs: [
					'勉強会を通して、複数の制約がある中でより良い選択肢を探す数理最適化を学んでいます。',
					'配送経路最適化をはじめ、現実の判断を計算可能な問題として表現するための基礎になっています。',
				],
			},
		],
	},
	{
		id: 'uec-osint-club',
		state: 'published',
		order: 150,
		slug: 'uec-osint-club',
		title: 'UEC OSINT CLUB・DIVER OSINT CTF',
		summary: '公開情報の出所と信頼性を検証しながら調査するOSINTに取り組み、DIVER OSINT CTF 2026で世界13位となりました。',
		period: '2026年',
		skillIds: ['python', 'arch-linux', 'github'],
		featured: true,
		links: [],
		detailSections: [
			{
				id: 'approach',
				title: '公開情報から事実へ近づく',
				paragraphs: [
					'UEC OSINT CLUBで、インターネット上の公開情報を収集、分析、検証するOSINTに取り組んでいます。',
					'検索結果をそのまま答えにするのではなく、元の資料へ戻り、日時や場所、発信者、他の情報との整合性を確認します。必要に応じて小さなツールも作り、調査を効率化します。',
				],
			},
			{
				id: 'ctf',
				title: 'DIVER OSINT CTF 2026',
				paragraphs: [
					'UEC OSINT CLUBとしてDIVER OSINT CTF 2026へ参加し、世界13位となりました。',
					'限られた時間の中で、チーム内で調査対象を分担し、見つけた情報と根拠を共有しながら問題を解きました。',
				],
			},
			{
				id: 'security',
				title: 'セキュリティへの接続',
				paragraphs: ['情報の出所を疑い、根拠をたどり、再現できる形で検証する姿勢は、セキュリティ調査やソフトウェアのデバッグにも通じると考えています。'],
			},
		],
	},
	{
		id: 'smart-beekeeping',
		state: 'published',
		order: 160,
		slug: 'smart-beekeeping',
		title: 'Urban Bee Clubとスマート養蜂',
		summary: '養蜂サークルの代表として、巣箱の観察や採蜜に加え、センサとWebを活用するスマート養蜂を進めています。',
		period: '2026年〜現在',
		skillIds: ['raspberry-pi-pico-2-w', 'python', 'typescript', 'html', 'css', 'astro'],
		featured: true,
		links: [],
		detailSections: [
			{
				id: 'beekeeping',
				title: '観察する活動',
				paragraphs: [
					'Urban Bee Clubで、巣箱の内検や採蜜などの養蜂活動に参加しています。2026年にはサークル代表を務めています。',
					'巣箱の状態は毎回同じではありません。蜂の様子、巣の状態、気温などの小さな変化を観察し、その場に応じた対応を考えます。',
				],
			},
			{
				id: 'smart-apiary',
				title: 'スマート養蜂',
				paragraphs: [
					'センサとデータを使い、巣箱の変化を継続的に把握するスマート養蜂を進めています。',
					'自然を完全に数値へ置き換えるのではなく、人による観察と計測データを組み合わせ、判断を助ける仕組みを目指しています。',
				],
			},
			{
				id: 'website',
				title: '情報発信',
				paragraphs: ['活動を知ってもらうためのサークルWebサイトも制作しています。技術開発と現場の活動を、外部へ分かりやすく伝えるところまでを一つの取り組みとして考えています。'],
			},
		],
	},
	{
		id: 'amateur-radio',
		state: 'published',
		order: 170,
		slug: 'amateur-radio',
		title: 'アマチュア無線とコンテスト運用',
		summary: '第三級アマチュア無線技士を取得し、6m AND DOWNコンテストなどで実際の交信と運用を経験しました。',
		period: '大学在学中',
		skillIds: ['n1mm-logger-plus'],
		featured: false,
		links: [],
		detailSections: [
			{
				id: 'operation',
				title: '無線運用',
				paragraphs: [
					'無線部で活動し、第三級アマチュア無線技士の資格を取得しました。6m AND DOWNコンテストなどで、交信とログ管理を経験しています。',
					'電波の状態や設備、周囲の運用状況によって結果が変わる中で、限られた情報から状況を判断します。',
				],
			},
			{
				id: 'interest',
				title: '通信への関心',
				paragraphs: [
					'見えない電波を使い、条件の異なる遠くの相手とつながる仕組みに関心があります。',
					'通信はロボットやセキュリティだけでなく、将来取り組みたい宇宙分野にもつながる基礎だと考えています。',
				],
			},
		],
	},
	{
		id: 'tourism-crossover-contest',
		state: 'published',
		order: 180,
		slug: 'tourism-crossover-contest',
		title: '観光クロスオーバーコンテスト2026',
		summary: '観光と異分野を組み合わせた提案で一次審査・予備審査を通過し、セミファイナリストまで進みました。',
		period: '2026年',
		skillIds: [],
		featured: false,
		links: [],
		detailSections: [
			{
				id: 'proposal',
				title: '分野を越えた提案',
				paragraphs: [
					'観光庁の観光クロスオーバーコンテスト2026へ参加し、観光と異なる分野を組み合わせた企画を提案しました。',
					'技術ありきではなく、地域や利用者にとってどのような価値になるのかを考え、実現方法とともに説明しました。',
				],
			},
			{
				id: 'result',
				title: 'セミファイナリスト',
				paragraphs: [
					'一次審査と予備審査を通過し、セミファイナリストまで進みました。',
					'専門分野の外へアイデアを持ち出し、異なる視点を組み合わせて提案する経験になりました。',
				],
			},
		],
	},
	{
		id: 'toward-space',
		state: 'published',
		order: 190,
		slug: 'toward-space',
		title: '地上で学んだ技術を宇宙へ',
		summary: 'ロボット、組込み、通信、画像認識、最適化、セキュリティを横断し、宇宙でも動くシステムを作ることを次の目標にしています。',
		period: 'これから',
		skillIds: ['ros-2', 'c', 'cpp', 'python', 'opencv', 'matlab'],
		featured: true,
		links: [],
		detailSections: [
			{
				id: 'direction',
				title: '次に進みたい領域',
				paragraphs: [
					'今後は、これまで学んできた技術を宇宙という領域へつなげたいと考えています。',
					'宇宙で動くシステムには、ロボット、組込み、通信、画像認識、最適化、セキュリティなど、複数分野の知識が同時に求められます。',
				],
			},
			{
				id: 'approach',
				title: '分野横断を強みにする',
				paragraphs: [
					'一つの分野だけで完結しないからこそ、興味を持った領域へ入り込み、必要な技術を学び、つなぎ合わせてきた経験を生かせると感じています。',
					'地上で確実に動くものを作る経験を積み重ねながら、将来は宇宙でも役立つシステムを作れる技術者を目指します。',
				],
			},
		],
	},
] as const satisfies readonly ProjectDefinition[];

const definedProjects = defineProjectCollection(projectDefinitions);

assertProjectSkillReferences(definedProjects, skills);

export const projects = definedProjects;
