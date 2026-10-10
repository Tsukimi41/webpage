import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ reducedMotion: 'no-preference' });

test('every third entrance mistypes, erases, retries and opens automatically', async ({ page }) => {
	await page.goto('/articles/');
	await page.evaluate(() => localStorage.removeItem('portfolio:terminal-visits:v1'));
	for (let visit = 1; visit <= 3; visit++) {
		await page.goto('/');
		const dialog = page.locator('[data-terminal-entry]');
		await expect(dialog).toBeVisible();
		await expect(dialog).toHaveAttribute('data-typo', String(visit === 3));
		if (visit < 3) {
			await page.keyboard.press('Escape');
			await expect(dialog).not.toBeVisible();
		} else {
			await expect(page.locator('[data-terminal-message]')).toContainText('command not found');
			await expect(dialog).toHaveAttribute('data-stage', 'correcting');
			await expect(page.locator('[data-terminal-command]')).toHaveText('open ./portfolio');
			await expect(dialog).not.toBeVisible();
			await expect(page.locator('#main-content')).toBeFocused();
		}
	}
});

for (const key of ['Escape', 'Tab']) {
	test(`${key} skips even while the animation chunk is loading`, async ({ page }) => {
		let release;
		const gate = new Promise(resolve => release = resolve);
		await page.route('**/terminal-sequence.ts*', async route => { await gate; await route.continue(); });
		await page.goto('/');
		await expect(page.locator('[data-terminal-entry]')).toBeVisible();
		await page.keyboard.press(key);
		await expect(page.locator('[data-terminal-entry]')).not.toBeVisible();
		await expect(page.locator(key === 'Tab' ? '.skip-link' : '#main-content')).toBeFocused();
		release();
	});
}

test('reduced motion and direct anchors bypass the entrance', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/');
	await expect(page.locator('[data-terminal-entry]')).not.toBeVisible();
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/#main-content');
	await expect(page.locator('[data-terminal-entry]')).not.toBeVisible();
});

test('terminal markup reflows and passes accessibility checks', async ({ page }) => {
	// Hold the real markup open for visual QA without extending the production timeout.
	await page.route('**/terminal-entry.ts*', route => route.fulfill({contentType:'application/javascript', body:''}));
	await page.setViewportSize({width:1440,height:900});
	await page.goto('/');
	await page.locator('[data-terminal-entry]').evaluate(dialog => dialog.showModal());
	await expect(page.locator('[data-terminal-entry]')).toBeVisible();
	await page.screenshot({path:test.info().outputPath('terminal-desktop.png')});
	const results = await new AxeBuilder({page}).include('[data-terminal-entry]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
	expect(results.violations).toEqual([]);
	await page.setViewportSize({width:320,height:568});
	expect(await page.locator('[data-terminal-entry]').evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
	await page.screenshot({path:test.info().outputPath('terminal-mobile.png')});
});

test('skip button opens the site immediately', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', {name:'サイトへ進む'}).click();
	await expect(page.locator('[data-terminal-entry]')).not.toBeVisible();
});

test('animation network failure cannot block the site', async ({ page }) => {
	await page.route('**/terminal-sequence.ts*', route => route.abort());
	await page.goto('/');
	await expect(page.locator('[data-terminal-entry]')).not.toBeVisible();
	await expect(page.locator('h1')).toBeVisible();
});
