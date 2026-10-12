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
	await expect(field.locator('[data-physics-role="skill"]')).toHaveCount(35);
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

test('skill bubbles respond to touch and keyboard with membrane wobble', async ({ page }) => {
	const field = await openSkills(page);
	const bubble = field.locator('[data-physics-role="skill"][data-physics-material="bubble"]').first();
	const button = bubble.locator('button');
	const initialPath = await bubble.locator('[data-bubble-membrane]').getAttribute('d');
	const box = await button.boundingBox();
	await button.dispatchEvent('pointerdown', { pointerId: 7, pointerType: 'touch', clientX: box.x + box.width / 2, clientY: box.y + box.height / 2, bubbles: true });
	await expect(bubble).toHaveAttribute('data-wobble-state', 'active');
	await button.dispatchEvent('pointerup', { pointerId: 7, pointerType: 'touch', bubbles: true });
	await button.focus();
	await page.keyboard.press('ArrowUp');
	await expect(bubble).toHaveAttribute('data-wobble-state', 'active');
	await expect.poll(() => bubble.locator('[data-bubble-membrane]').getAttribute('d')).not.toBe(initialPath);
	await expect.poll(() => bubble.locator('.skill-object__surface').evaluate(el => getComputedStyle(el).transform)).toBe('none');
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

test('ambient bubbles burst and respawn while skill bubbles stay intact', async ({ page }) => {
	const field = await openSkills(page);
	const bursting = field.locator('[data-physics-role="ambient"][data-burst-state="bursting"]').first();
	await expect(bursting).toBeAttached({ timeout: 12000 });
	const index = await bursting.evaluate(el => [...el.parentElement.querySelectorAll('[data-physics-role="ambient"]')].indexOf(el));
	await expect(field.locator('[data-physics-role="ambient"]').nth(index)).toHaveAttribute('data-burst-state', 'idle');
	await expect(field.locator('[data-physics-role="skill"][data-burst-state="bursting"]')).toHaveCount(0);
});


test('an isolated bubble settles after an oblique touch without spinning or continued path changes', async ({ page }) => {
	// Use the real component/controller in an otherwise empty field to isolate decay from new impacts.
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/#skill-showcase-title');
	await page.evaluate(async () => {
		const { startSkillPhysics } = await import('/src/scripts/skill-physics.ts');
		const source = document.querySelector('[data-physics-role="skill"][data-physics-material="bubble"]');
		const field = document.createElement('div');
		field.id = 'isolated-bubble-field';
		field.style.cssText = 'position:fixed;inset:0;z-index:10000;background:#10241e';
		const bubble = source.cloneNode(true);
		bubble.style.cssText = '--object-base-size:80px;width:80px;height:80px';
		bubble.dataset.physicsX = '50';
		bubble.dataset.physicsY = '50';
		// Avoid duplicate SVG references to the source field.
		bubble.querySelectorAll('[id]').forEach(el => { el.id += '-isolated'; });
		bubble.querySelectorAll('use').forEach(el => {
			el.setAttribute('href', el.getAttribute('href') + '-isolated');
		});
		for (const el of bubble.querySelectorAll('[fill], [stroke]')) {
			for (const name of ['fill', 'stroke']) {
				const value = el.getAttribute(name);
				if (value?.startsWith('url(')) el.setAttribute(name, value.replace(')', '-isolated)'));
			}
		}
		field.append(bubble);
		document.body.append(field);
		startSkillPhysics(field);
	});
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	const field = page.locator('#isolated-bubble-field');
	const bubble = field.locator('[data-physics-object]');
	const button = bubble.locator('button');
	const box = await button.boundingBox();
	await button.dispatchEvent('pointerdown', { pointerId: 17, pointerType: 'touch',
		clientX: box.x + box.width * .8, clientY: box.y + box.height * .2, bubbles: true });
	await expect(bubble).toHaveAttribute('data-wobble-state', 'active');
	await button.dispatchEvent('pointerup', { pointerId: 17, pointerType: 'touch', bubbles: true });
	await expect(bubble).toHaveAttribute('data-wobble-state', 'idle', { timeout: 6000 });
	// Includes its later ceiling contact. Wait until all impacts have settled.
	await page.waitForTimeout(6000);
	await expect(bubble).toHaveAttribute('data-wobble-state', 'idle');
	const stablePath = await bubble.locator('[data-bubble-membrane]').getAttribute('d');
	await page.waitForTimeout(600);
	await expect(bubble.locator('[data-bubble-membrane]')).toHaveAttribute('d', stablePath);
	await expect.poll(() => bubble.locator('.skill-object__surface').evaluate(el => getComputedStyle(el).transform)).toBe('none');
});
