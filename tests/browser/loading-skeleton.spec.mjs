import { test, expect } from '@playwright/test';

for (const motion of ['reduce', 'no-preference']) {
	test(`loading skeleton follows the request and respects motion ${motion}`, async ({ page }) => {
		await page.emulateMedia({reducedMotion:motion});
		let release;
		const gate = new Promise(resolve => release = resolve);
		await page.route('**/skill-physics.ts*', async route => { await gate; await route.continue(); });
		await page.goto('/#skill-showcase-title');
		await page.locator('.skill-showcase__interactive summary').click();
		try {
			const skeleton = page.locator('.skill-skeleton');
			await expect(skeleton).toBeVisible();
			const field = page.locator('[data-skill-field]');
			await expect(field).toHaveAttribute('aria-busy', 'true');
			const before = await field.boundingBox();
			const animation = await page.locator('.skill-skeleton > span').first().evaluate(el => getComputedStyle(el, '::after').animationName);
			expect(animation === 'none').toBe(motion === 'reduce');
			await page.screenshot({path:test.info().outputPath(`skeleton-${motion}.png`)});
			release();
			await expect(skeleton).toBeHidden();
			await expect(field).toHaveAttribute('data-load-state', 'ready');
			const after = await field.boundingBox();
			expect(Math.abs(before.height - after.height)).toBeLessThanOrEqual(1);
		} finally { release(); }
	});
}
