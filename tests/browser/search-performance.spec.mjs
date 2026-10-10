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
	await input.evaluate(element => {
		element.value = '日本語';
		element.dispatchEvent(new InputEvent('input', {bubbles:true, isComposing:true}));
	});
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

test('submitting unchanged criteria does not rewrite results', async ({ page }) => {
	await page.goto('/articles/?q=astro');
	await expect(page.locator('[data-article-explorer]')).toHaveAttribute('data-enhanced', 'true');
	const mutations = await page.evaluate(async () => {
		let count = 0;
		const observer = new MutationObserver(records => count += records.length);
		observer.observe(document.querySelector('[data-article-explorer]'), {subtree:true, childList:true, attributes:true, characterData:true});
		document.querySelector('[data-search-form]').requestSubmit();
		await new Promise(resolve => setTimeout(resolve, 0));
		observer.disconnect();
		return count;
	});
	expect(mutations).toBe(0);
});
