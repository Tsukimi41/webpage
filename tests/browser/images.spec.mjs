import { test, expect } from '@playwright/test';

test('compressed profile, sidebar and skill images decode successfully', async ({ page }) => {
	await page.goto('/');
	const profile = page.locator('.introduction__icon');
	await expect(profile).toHaveAttribute('src', /profile\.webp$/);
	await expect.poll(() => profile.evaluate(image => image.naturalWidth)).toBe(256);
	await expect(page.locator('.site-sidebar__profile-icon img')).toHaveAttribute('loading', 'lazy');
	await page.locator('.skill-showcase__interactive summary').click();
	for (const name of ['voicevox', 'wsl-2']) {
		const image = page.locator(`[data-skill-visual-image][src$="${name}.webp"]`).first();
		await image.scrollIntoViewIfNeeded();
		await expect.poll(() => image.evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
	}
	await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /favicon\.png$/);
});
