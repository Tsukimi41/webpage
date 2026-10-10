import { test, expect } from '@playwright/test';

test('search coalesces input, waits for IME, and submits immediately', async ({ page }) => {
	await page.goto('/articles/');
	await expect(page.locator('[data-article-explorer]')).toHaveAttribute('data-enhanced', 'true');
	await page.clock.install();
	const input = page.getByRole('searchbox');
	await input.fill('no');
	await page.clock.runFor(80);
	await input.fill('no-such-article');
	await page.clock.runFor(80);
	await expect(page).not.toHaveURL(/q=/);
	await page.clock.runFor(50);
	await expect(page).toHaveURL(/q=no-such-article/);
	await input.dispatchEvent('compositionstart');
	await input.fill('日本語');
	await page.clock.runFor(200);
	await expect(page).toHaveURL(/q=no-such-article/);
	await input.dispatchEvent('compositionend');
	await page.clock.runFor(121);
	expect(new URL(page.url()).searchParams.get('q')).toBe('日本語');
	await input.fill('Astro');
	await page.getByRole('button', { name: '検索結果を見る' }).click();
	await expect(page).toHaveURL(/q=Astro/);
	await input.fill('pending');
	await page.getByRole('button', { name: '条件をクリア' }).click();
	await page.clock.runFor(200);
	await expect(page).not.toHaveURL(/q=/);
});
