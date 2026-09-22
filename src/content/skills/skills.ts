import {
	defineSkillCollection,
	type SkillDefinition,
	type SkillImageVisualDefinition,
} from './skill.ts';

const suppliedImages: Readonly<Record<string, Readonly<{
		src: SkillImageVisualDefinition['src'];
		width: number;
		height: number;
}>>> = {
	mixamo: { src: '/icons/skills/mixamo.svg', width: 42, height: 48 },
	voicevox: { src: '/icons/skills/voicevox.png', width: 256, height: 256 },
	'wsl-2': { src: '/icons/skills/wsl-2.png', width: 380, height: 380 },
	'xampp-control-panel': {
		src: '/icons/skills/xampp-control-panel.svg',
		width: 256,
		height: 258,
	},
};

function skillImage(id: string, label: string): SkillImageVisualDefinition {
	const suppliedImage = suppliedImages[id];

	return {
		kind: 'image',
		src: suppliedImage?.src ?? `/icons/skills/${id}.svg`,
		alt: `${label}のアイコン`,
		width: suppliedImage?.width ?? 128,
		height: suppliedImage?.height ?? 128,
	};
}

const skillDefinitions = [
	{
		id: 'ros-2', state: 'published', order: 10, label: 'ROS 2', category: 'framework',
		summary: 'ロボットのノード、トピック、サービスを組み合わせた分散システムを構成します。',
		presentation: 'marble',
		scale: 'large',
		visual: skillImage('ros-2', 'ROS 2'),
	},
	{
		id: 'arch-linux', state: 'published', order: 20, label: 'Arch Linux', category: 'operating-system',
		summary: '必要な構成を選びながらLinux環境を組み立て、開発環境を管理します。',
		presentation: 'marble',
		scale: 'large',
		visual: skillImage('arch-linux', 'Arch Linux'),
	},
	{
		id: 'github', state: 'published', order: 30, label: 'GitHub', category: 'platform',
		summary: 'ソースコード、変更履歴、レビュー、共同開発の流れを一か所で管理します。',
		presentation: 'marble',
		scale: 'large',
		visual: skillImage('github', 'GitHub'),
	},
	{
		id: 'python', state: 'published', order: 40, label: 'Python', category: 'language',
		summary: '自動化、画像処理、ロボット制御などの処理を読みやすいコードで組み立てます。',
		presentation: 'marble',
		scale: 'large',
		visual: skillImage('python', 'Python'),
	},
	{
		id: 'node-js', state: 'published', order: 50, label: 'Node.js', category: 'runtime',
		summary: 'JavaScriptとTypeScriptのツールやサーバー処理を実行する環境として利用します。',
		presentation: 'marble',
		scale: 'large',
		visual: skillImage('node-js', 'Node.js'),
	},
	{
		id: 'c', state: 'published', order: 60, label: 'C', category: 'language',
		summary: 'メモリやハードウェアに近い処理を意識しながら、小さく予測可能な実装を行います。',
		presentation: 'marble',
		scale: 'large',
		visual: skillImage('c', 'C'),
	},
	{
		id: 'cpp', state: 'published', order: 70, label: 'C++', category: 'language',
		summary: '性能が必要なアプリケーションやロボット・画像処理の実装に利用します。',
		presentation: 'marble',
		scale: 'large',
		visual: skillImage('cpp', 'C++'),
	},
	{
		id: 'aruco-marker', state: 'published', order: 80, label: 'ArUco Marker', category: 'library',
		summary: 'カメラ画像からマーカーを検出し、識別や姿勢推定へつなげます。',
		presentation: 'marble',
		scale: 'medium',
		visual: skillImage('aruco-marker', 'ArUco Marker'),
	},
	{
		id: 'docker', state: 'published', order: 90, label: 'Docker', category: 'infrastructure',
		summary: '依存関係をコンテナへまとめ、再現しやすい開発・実行環境を作ります。',
		presentation: 'marble',
		scale: 'large',
		visual: skillImage('docker', 'Docker'),
	},
	{
		id: 'latex', state: 'published', order: 100, label: 'LaTeX', category: 'markup',
		summary: '数式や参照を含む技術文書を、構造化された原稿から組版します。',
		presentation: 'bubble',
		scale: 'large',
		visual: skillImage('latex', 'LaTeX'),
	},
	{
		id: 'vite', state: 'published', order: 110, label: 'Vite', category: 'tool',
		summary: 'フロントエンドの開発サーバーとビルドを高速で扱えるよう構成します。',
		presentation: 'bubble',
		scale: 'medium',
		visual: skillImage('vite', 'Vite'),
	},
	{
		id: 'typescript', state: 'published', order: 120, label: 'TypeScript', category: 'language',
		summary: 'データ境界を型と実行時検証の両方で守り、変更時の不整合を早期に検出します。',
		presentation: 'bubble',
		scale: 'large',
		visual: skillImage('typescript', 'TypeScript'),
	},
	{
		id: 'html', state: 'published', order: 130, label: 'HTML', category: 'markup',
		summary: '意味のある文書構造を組み立て、操作性とアクセシビリティの土台を作ります。',
		presentation: 'bubble',
		scale: 'medium',
		visual: skillImage('html', 'HTML'),
	},
	{
		id: 'css', state: 'published', order: 140, label: 'CSS', category: 'styling',
		summary: 'レスポンシブ、テーマ、動きの低減を含む堅牢な視覚表現を設計します。',
		presentation: 'bubble',
		scale: 'medium',
		visual: skillImage('css', 'CSS'),
	},
	{
		id: 'opencv', state: 'published', order: 150, label: 'OpenCV', category: 'library',
		summary: '画像の変換、特徴抽出、カメラ処理を行い、視覚情報を扱う機能を構築します。',
		presentation: 'marble',
		scale: 'large',
		visual: skillImage('opencv', 'OpenCV'),
	},
	{
		id: 'mixamo', state: 'published', order: 160, label: 'Mixamo', category: 'design',
		summary: '3Dキャラクターへリグやアニメーションを適用し、動きの試作に利用します。',
		presentation: 'bubble',
		scale: 'medium',
		visual: skillImage('mixamo', 'Mixamo'),
	},
	{
		id: 'wsl-2', state: 'published', order: 170, label: 'WSL 2', category: 'platform',
		summary: 'Windows上にLinux開発環境を用意し、両方のツールを連携して利用します。',
		presentation: 'marble',
		scale: 'medium',
		visual: skillImage('wsl-2', 'WSL 2'),
	},
	{
		id: 'amt-viewpoint', state: 'published', order: 180, label: 'AMT Viewpoint', category: 'tool',
		summary: 'エンコーダーの設定、状態確認、診断を製品固有のツールから行います。',
		presentation: 'marble',
		scale: 'small',
		visual: skillImage('amt-viewpoint', 'AMT Viewpoint'),
	},
	{
		id: 'voicevox', state: 'published', order: 190, label: 'VOICEVOX', category: 'tool',
		summary: '音声合成を利用し、読み上げやキャラクターボイスを伴う表現を試作します。',
		presentation: 'bubble',
		scale: 'medium',
		visual: skillImage('voicevox', 'VOICEVOX'),
	},
	{
		id: 'ubuntu', state: 'published', order: 200, label: 'Ubuntu', category: 'operating-system',
		summary: 'デスクトップ、WSL、サーバーなどのLinux開発・実行環境として利用します。',
		presentation: 'marble',
		scale: 'large',
		visual: skillImage('ubuntu', 'Ubuntu'),
	},
	{
		id: 'xampp-control-panel', state: 'published', order: 210, label: 'XAMPP Control Panel', category: 'infrastructure',
		summary: 'ローカルのWebサーバー、データベース、関連サービスをまとめて管理します。',
		presentation: 'marble',
		scale: 'small',
		visual: skillImage('xampp-control-panel', 'XAMPP Control Panel'),
	},
	{
		id: 'solidworks', state: 'published', order: 220, label: 'SOLIDWORKS', category: 'design',
		summary: '機械部品やアセンブリを3D CADで設計し、形状と構造を検討します。',
		presentation: 'marble',
		scale: 'small',
		visual: skillImage('solidworks', 'SOLIDWORKS'),
	},
	{
		id: 'matlab', state: 'published', order: 230, label: 'MATLAB', category: 'tool',
		summary: '数値計算、データ解析、制御系の検討や可視化に利用します。',
		presentation: 'marble',
		scale: 'small',
		visual: skillImage('matlab', 'MATLAB'),
	},
	{
		id: 'raspberry-pi-pico-2-w', state: 'published', order: 240, label: 'Raspberry Pi Pico 2 W', category: 'hardware',
		summary: '無線通信を備えたマイコンで、センサーや小型デバイスの制御を試作します。',
		presentation: 'marble',
		scale: 'large',
		visual: skillImage('raspberry-pi-pico-2-w', 'Raspberry Pi Pico 2 W'),
	},
	{
		id: 'godot', state: 'published', order: 250, label: 'Godot', category: 'framework',
		summary: 'シーンとノードを組み合わせ、ゲームやインタラクティブ表現を制作します。',
		presentation: 'bubble',
		scale: 'small',
		visual: skillImage('godot', 'Godot'),
	},
	{
		id: 'lapis-lexide', state: 'published', order: 260, label: 'Lapis LEXIDE', category: 'tool',
		summary: '専用の組み込み開発環境として、対象デバイス向けの実装と確認に利用します。',
		presentation: 'marble',
		scale: 'small',
		visual: skillImage('lapis-lexide', 'Lapis LEXIDE'),
	},
	{
		id: 'vroid-studio-2-8-0', state: 'published', order: 270, label: 'VRoid Studio 2.8.0', category: 'design',
		summary: '3Dキャラクターモデルの外観を編集し、他の制作環境で使える形へ整えます。',
		presentation: 'bubble',
		scale: 'medium',
		visual: skillImage('vroid-studio-2-8-0', 'VRoid Studio 2.8.0'),
	},
	{
		id: 'n1mm-logger-plus', state: 'published', order: 280, label: 'N1MM Logger+', category: 'tool',
		summary: 'アマチュア無線のコンテスト運用で、交信記録や局情報を管理します。',
		presentation: 'marble',
		scale: 'small',
		visual: skillImage('n1mm-logger-plus', 'N1MM Logger+'),
	},
	{
		id: 'astro', state: 'published', order: 290, label: 'Astro', category: 'framework',
		summary: '静的HTMLを中心に、必要な操作だけへ小さなJavaScriptを追加します。',
		presentation: 'bubble',
		scale: 'medium',
		visual: skillImage('astro', 'Astro'),
	},
	{
		id: 'markdown', state: 'published', order: 300, label: 'Markdown', category: 'markup',
		summary: '文章と構造を表示実装から分離し、継続的に更新できる形で管理します。',
		presentation: 'bubble',
		scale: 'medium',
		visual: skillImage('markdown', 'Markdown'),
	},
	{
		id: 'github-actions', state: 'published', order: 310, label: 'GitHub Actions', category: 'infrastructure',
		summary: '検証を自動化し、公開前に品質上の問題を検出できる流れを組み立てます。',
		presentation: 'marble',
		scale: 'medium',
		visual: skillImage('github-actions', 'GitHub Actions'),
	},
	{
		id: 'vercel', state: 'published', order: 320, label: 'Vercel', category: 'platform',
		summary: 'フロントエンドを継続的にデプロイし、プレビューと本番公開を管理します。',
		presentation: 'bubble',
		scale: 'medium',
		visual: skillImage('vercel', 'Vercel'),
	},
] as const satisfies readonly SkillDefinition[];

export const skills = defineSkillCollection(skillDefinitions);
