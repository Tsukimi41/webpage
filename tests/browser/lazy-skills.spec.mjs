import { test, expect } from '@playwright/test';

test('physics is fetched only on demand and ignores a closed loading panel', async ({ page }) => {
	let requests = 0;
	let release;
	const gate = new Promise(resolve => release = resolve);
	await page.route('**/skill-physics.ts*', async route => {
		requests++;
		await gate;
		await route.continue();
	});
	await page.goto('/');
	expect(requests).toBe(0);
	const summary = page.locator('.skill-showcase__interactive summary');
	const field = page.locator('[data-skill-field]');
	await summary.click();
	await expect(field).toHaveAttribute('aria-busy', 'true');
	await expect.poll(() => requests).toBe(1);
	await summary.click();
	release();
	await expect(field).not.toHaveAttribute('aria-busy');
	await expect(field).not.toHaveAttribute('data-physics-ready');
	await summary.click();
	await expect(field).toHaveAttribute('data-physics-ready', 'true');
	await summary.click();
	await expect(field).not.toHaveAttribute('data-physics-ready');
	expect(requests).toBe(1);
});

test('failed loading leaves the static list usable and explains retry', async ({ page }) => {
	await page.route('**/skill-physics.ts*', route => route.abort());
	await page.goto('/');
	await page.locator('.skill-showcase__interactive summary').click();
	await expect(page.locator('[data-skill-field]')).toHaveAttribute('data-load-state', 'error');
	await expect(page.locator('[data-skill-load-note]')).toContainText('再試行');
	await expect(page.locator('.skill-showcase__list')).toBeVisible();
});
