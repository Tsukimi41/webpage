export const THEME_STORAGE_KEY = 'tsukimi41-color-theme';

export const themes = [
	{
		id: 'light-blue',
		label: 'ライト',
		description: '白・青・灰色',
	},
	{
		id: 'dark-blue',
		label: 'ダーク',
		description: '白・青・灰色のダークモード',
	},
	{
		id: 'dark-green',
		label: 'グリーン',
		description: '黒・緑・灰色',
	},
] as const;

export type ThemeId = (typeof themes)[number]['id'];

export const DEFAULT_THEME_ID: ThemeId = 'dark-green';
export const themeIds: readonly ThemeId[] = themes.map((theme) => theme.id);
