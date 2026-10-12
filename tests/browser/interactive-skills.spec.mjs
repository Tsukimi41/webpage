import { test, expect } from '@playwright/test';

test.use({ reducedMotion: 'no-preference', viewport: { width: 1100, height: 1000 } });
test.setTimeout(180_000);

async function openSkills(page) {
	await page.goto('/#skill-showcase-title');
	const field = page.locator('[data-skill-field]');
	await field.scrollIntoViewIfNeeded();
	await expect(field).toBeVisible();
	await expect(field).toHaveAttribute('data-physics-ready', 'true');
	await expect(field).toHaveAttribute('data-physics-state', 'running');
	return field;
}

test('completed skill field is visible immediately and marbles can be dragged and released', async ({ page }) => {
	const field = await openSkills(page);
	await expect(page.locator('.skill-showcase details')).toHaveCount(0);
	await expect(page.locator('.skill-showcase__list, .skill-skeleton')).toHaveCount(0);
	await expect(field.locator('[data-physics-role="skill"]')).toHaveCount(32);
	await expect(field.locator('[data-physics-role="ambient"]')).toHaveCount(6);
	const marble = field.locator('[data-physics-material="marble"]').first();
	const box = await marble.boundingBox();
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
	const dragged = field.locator('.is-dragged');
	await expect(dragged).toHaveCount(1);
	const before = await dragged.boundingBox();
	await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 - 60, { steps: 8 });
	await expect.poll(async () => {
		const after = await dragged.boundingBox();
		return Math.hypot(after.x - before.x, after.y - before.y);
	}).toBeGreaterThan(25);
	await page.mouse.up();
	await expect(dragged).toHaveCount(0);
	await field.screenshot({ path: test.info().outputPath('restored-skills.png') });
});

test('restored field fits mobile and keeps the original reduced motion behavior', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/#skill-showcase-title');
	const field = page.locator('[data-skill-field]');
	await field.scrollIntoViewIfNeeded();
	await expect(field).toBeVisible();
	await expect(field).toHaveAttribute('data-physics-ready', 'true');
	await expect(field).toHaveAttribute('data-physics-state', 'reduced-motion');
	expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
	await field.screenshot({ path: test.info().outputPath('restored-skills-mobile.png') });
});
