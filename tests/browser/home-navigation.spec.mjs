import { test, expect } from '@playwright/test';

test.use({ reducedMotion: 'no-preference' });
test.setTimeout(180_000);

test.beforeEach(async ({ page }) => {
	// Count even a transient opening before the assertion can see the document.
	await page.addInitScript(() => {
		window.terminalOpenCount = 0;
		const showModal = HTMLDialogElement.prototype.showModal;
		HTMLDialogElement.prototype.showModal = function (...args) {
			if (this.matches('[data-terminal-entry]')) window.terminalOpenCount++;
			return showModal.apply(this, args);
		};
	});
});

async function expectOrdinaryHome(page) {
	await expect(page).toHaveURL(/\/#site-top$/);
	await expect(page.locator('h1')).toBeVisible();
	await expect(page.locator('[data-terminal-entry]')).not.toBeVisible();
	expect(await page.evaluate(() => window.terminalOpenCount)).toBe(0);
	await expect(page.getByRole('navigation', { name: 'メインメニュー' })
		.getByRole('link', { name: 'ホーム', exact: true })).toHaveAttribute('aria-current', 'page');
}

test('every internal home link bypasses the terminal from its first frame', async ({ page }) => {
	for (const [source, selector] of [
		['/profile/', '.site-header__nav'],
		['/articles/', '.site-header__nav'],
		['/profile/', '.site-header__brand'],
		['/articles/', '.site-footer__nav'],
		['/projects/', '.projects-page__back'],
	]) {
		await page.goto(source);
		const container = page.locator(selector);
		const link = selector.endsWith('__nav')
			? container.getByRole('link', { name: 'ホーム', exact: true }) : container;
		await link.click();
		await expectOrdinaryHome(page);
	}
	const timeOrigin = await page.evaluate(() => performance.timeOrigin);
	await page.getByRole('navigation', { name: 'メインメニュー' })
		.getByRole('link', { name: 'ホーム', exact: true }).click();
	await expectOrdinaryHome(page);
	expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin);
});

test('home navigation works without storage or referrer, including a reload', async ({ page }) => {
	await page.addInitScript(() => {
		Storage.prototype.getItem = Storage.prototype.setItem = () => { throw new Error('blocked'); };
	});
	await page.goto('/articles/');
	const link = page.getByRole('navigation', { name: 'メインメニュー' })
		.getByRole('link', { name: 'ホーム', exact: true });
	await link.evaluate(el => { el.referrerPolicy = 'no-referrer'; });
	await link.click();
	await expectOrdinaryHome(page);
	expect(await page.evaluate(() => document.referrer)).toBe('');
	await page.reload();
	await expectOrdinaryHome(page);
});

test('a direct home visit still opens the terminal and Escape dismisses it', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('[data-terminal-entry]')).toBeVisible();
	expect(await page.evaluate(() => window.terminalOpenCount)).toBe(1);
	await page.keyboard.press('Escape');
	await expect(page.locator('[data-terminal-entry]')).not.toBeVisible();
});
