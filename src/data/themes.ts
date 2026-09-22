export const THEME_STORAGE_KEY = 'tsukimi41-color-theme';

export const themeIds = ['light-blue', 'dark-blue', 'dark-green'] as const;

export type ThemeId = (typeof themeIds)[number];

export const DEFAULT_THEME_ID: ThemeId = 'dark-green';
