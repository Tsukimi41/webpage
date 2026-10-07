import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests/browser',
	timeout: 120_000,
	workers: 2,
	use: { baseURL: 'http://127.0.0.1:4321', reducedMotion: 'reduce' },
	webServer: {
		command: 'node scripts/browser-test-server.mjs',
		env: { ASTRO_TELEMETRY_DISABLED: '1', ASTRO_DISABLE_UPDATE_CHECK: 'true' },
		url: 'http://127.0.0.1:4321',
		timeout: 120_000,
		reuseExistingServer: !process.env.CI,
	},
	projects: [
		{ name: 'chromium', use: { browserName: 'chromium' } },
		{ name: 'firefox', use: { browserName: 'firefox' } },
		{ name: 'webkit', use: { browserName: 'webkit' } },
	],
});
