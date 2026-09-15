export const THEME_STORAGE_KEY = 'tsukimi41-color-theme';

export const themes = [
	{
		id: 'light-blue',
		label: '',
		description: '',
	},
	{
		id: 'dark-blue',
		label: 'ダーク',
		description: '',
	},
	{
		id: 'dark-green',
		label: 'グリーン',
		description: '',
	},
] as const;

export type ThemeId = (typeof themes)[number]['id'];

export const DEFAULT_THEME_ID: ThemeId = 'dark-green';
export const themeIds: readonly ThemeId[] = themes.map((theme) => theme.id);
