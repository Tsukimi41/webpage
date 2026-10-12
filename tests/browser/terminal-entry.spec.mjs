import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ reducedMotion: 'no-preference' });

test('entrance leaves time to read, then types, loads in stages and fades out', async ({ page }) => {
	await page.goto('/', {waitUntil:'domcontentloaded'});
	const dialog = page.locator('[data-terminal-entry]');
	const command = page.locator('[data-terminal-command]');
	await expect(dialog).toHaveAttribute('data-stage', 'waiting');
	await expect(command).toBeEmpty();
	// This deliberate pause is part of the reading-time contract.
	await page.waitForTimeout(450);
	await expect(command).toBeEmpty();
	await expect(dialog).toHaveAttribute('data-stage', 'typing');
	await expect(command).toHaveText('open ./portfolio');
	await expect(dialog).toHaveAttribute('data-stage', 'submitted');
	await expect(page.locator('.terminal-entry__enter')).toBeVisible();
	await expect(dialog).toHaveAttribute('data-stage', 'loading');
	const loadingStarted = await page.evaluate(() => performance.now());
	const steps = page.locator('[data-terminal-step]');
	await expect(steps.first()).toHaveAttribute('data-state', 'active');
	await expect(steps.nth(2)).toHaveAttribute('data-state', 'active');
	await expect(steps.nth(0)).toHaveAttribute('data-state', 'complete');
	await expect(steps.nth(1)).toHaveAttribute('data-state', 'complete');
	await expect(dialog).toHaveAttribute('data-stage', 'ready');
	expect(await page.evaluate(() => performance.now()) - loadingStarted).toBeGreaterThan(1500);
	await expect(page.locator('[data-terminal-status]')).toHaveText('準備完了。ようこそ');
	await expect(dialog).not.toBeVisible();
	await expect(page.locator('#main-content')).toBeFocused();
});

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
		try {
			// Firefox/WebKit can include dynamic modules in the load event.
			await page.goto('/', {waitUntil:'domcontentloaded'});
			await expect(page.locator('[data-terminal-entry]')).toBeVisible();
			await page.keyboard.press(key);
			await expect(page.locator('[data-terminal-entry]')).not.toBeVisible();
			await expect(page.locator(key === 'Tab' ? '.skip-link' : '#main-content')).toBeFocused();
		} finally { release(); }
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
	await page.locator('[data-terminal-entry]').evaluate(dialog => {
		dialog.dataset.stage = 'loading';
		dialog.querySelector('[data-terminal-command]').textContent = 'open ./portfolio';
		dialog.querySelector('[data-terminal-status]').textContent = 'ポートフォリオを開いています';
		dialog.querySelectorAll('[data-terminal-step]').forEach((step, index) => {
			if (index < 2) step.dataset.state = index === 0 ? 'complete' : 'active';
		});
		dialog.showModal();
	});
	await expect(page.locator('[data-terminal-entry]')).toBeVisible();
	await page.screenshot({path:test.info().outputPath('terminal-desktop.png'), animations:'disabled'});
	const results = await new AxeBuilder({page}).include('[data-terminal-entry]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
	expect(results.violations).toEqual([]);
	await page.setViewportSize({width:320,height:568});
	expect(await page.locator('[data-terminal-entry]').evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
	const skipButton = await page.getByRole('button', {name:'サイトへ進む'}).boundingBox();
	expect(skipButton.y + skipButton.height).toBeLessThanOrEqual(558);
	await page.screenshot({path:test.info().outputPath('terminal-mobile.png'), animations:'disabled'});
	await page.locator('[data-terminal-result]').evaluate(el => { el.textContent = '✓ Welcome. Opening your next discovery.'; });
	const completedSkipButton = await page.getByRole('button', {name:'サイトへ進む'}).boundingBox();
	expect(completedSkipButton.y + completedSkipButton.height).toBeLessThanOrEqual(558);
});

test('skip button opens the site immediately', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', {name:'サイトへ進む'}).click();
	await expect(page.locator('[data-terminal-entry]')).not.toBeVisible();
});

test('Escape also cancels the longer post-command loading sequence', async ({ page }) => {
	await page.goto('/');
	const dialog = page.locator('[data-terminal-entry]');
	await expect(dialog).toHaveAttribute('data-stage', 'loading', {timeout:8000});
	await page.keyboard.press('Escape');
	await expect(dialog).not.toBeVisible();
	await expect(page.locator('#main-content')).toBeFocused();
	await page.waitForTimeout(800);
	await expect(dialog).toHaveAttribute('data-stage', 'loading');
	await expect(dialog).not.toBeVisible();
});

test('a stalled animation download releases the entrance through its watchdog', async ({ page }) => {
	let release;
	const gate = new Promise(resolve => release = resolve);
	await page.route('**/terminal-sequence.ts*', async route => { await gate; await route.continue(); });
	try {
		await page.goto('/', {waitUntil:'domcontentloaded'});
		await expect(page.locator('[data-terminal-entry]')).toBeVisible();
		await expect(page.locator('[data-terminal-entry]')).not.toBeVisible({timeout:18000});
		await expect(page.locator('#main-content')).toBeFocused();
	} finally { release(); }
});

test('animation network failure cannot block the site', async ({ page }) => {
	await page.route('**/terminal-sequence.ts*', route => route.abort());
	await page.goto('/');
	await expect(page.locator('[data-terminal-entry]')).not.toBeVisible();
	await expect(page.locator('h1')).toBeVisible();
});
