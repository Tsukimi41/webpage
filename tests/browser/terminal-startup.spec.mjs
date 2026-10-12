import { test, expect } from '@playwright/test';
import { TERMINAL_CONFIG } from '../../src/config/terminal.ts';
import { createTerminalTiming } from '../../src/scripts/terminal-timing.ts';

test.use({ reducedMotion: 'no-preference' });
test.setTimeout(180_000);

test('terminal covers the first frame even while its entry module is delayed', async ({ page }) => {
	let release;
	const gate = new Promise(resolve => release = resolve);
	await page.route('**/terminal-entry.ts*', async route => { await gate; await route.continue(); });
	try {
		await page.goto('/', { waitUntil: 'commit' });
		const dialog = page.locator('[data-terminal-entry]');
		await expect(dialog).toBeVisible();
		await expect(dialog).toHaveAttribute('data-stage', 'booting');
		const motion = createTerminalTiming().motion;
		const durations = await dialog.evaluate(el => ({
			fade: parseFloat(getComputedStyle(el).transitionDuration) * 1000,
			backdrop: parseFloat(getComputedStyle(el, '::backdrop').transitionDuration) * 1000,
			cursor: parseFloat(getComputedStyle(el.querySelector('.terminal-entry__cursor')).animationDuration) * 1000,
		}));
		expect(durations).toEqual({ fade: motion.exitFadeMs, backdrop: motion.exitFadeMs, cursor: motion.cursorBlinkMs });
		await page.waitForTimeout(500);
		expect(await page.evaluate(() => {
			const dialog = document.querySelector('[data-terminal-entry]');
			return dialog.matches(':modal') && dialog.contains(document.elementFromPoint(innerWidth / 2, innerHeight / 2));
		})).toBe(true);
		// Screenshots wait for fonts.ready in Firefox/WebKit, which may depend on
		// the deliberately blocked module. Inspect the painted hit target above instead.
		await page.keyboard.press('Escape');
		await expect(dialog).not.toBeVisible();
		release();
		await page.waitForLoadState('domcontentloaded');
		await expect(dialog).not.toBeVisible();
		await expect(page.locator('#main-content')).toBeFocused();
	} finally { release(); }
});

test('the inline watchdog releases a stalled entry module without reopening later', async ({ page }) => {
	let release;
	const gate = new Promise(resolve => release = resolve);
	await page.clock.install();
	await page.route('**/terminal-entry.ts*', async route => { await gate; await route.continue(); });
	try {
		await page.goto('/', { waitUntil: 'commit' });
		const dialog = page.locator('[data-terminal-entry]');
		await expect(dialog).toBeVisible();
		await page.clock.fastForward(TERMINAL_CONFIG.safety.downloadTimeoutMs + 1);
		await expect(dialog).not.toBeVisible();
		release();
		await page.waitForLoadState('domcontentloaded');
		await expect(dialog).not.toBeVisible();
		await expect(page.locator('h1')).toBeVisible();
	} finally { release(); }
});

test('JavaScript disabled leaves the document readable', async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	try {
		const page = await context.newPage();
		await page.goto('http://127.0.0.1:4321/');
		await expect(page.locator('[data-terminal-entry]')).not.toBeVisible();
		await expect(page.locator('h1')).toBeVisible();
	} finally { await context.close(); }
});
