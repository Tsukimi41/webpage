import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/', '/articles/', '/articles/arch1/', '/articles/arch2/', '/articles/my-first-post/', '/profile/', '/projects/', '/projects/smart-beekeeping/', '/404.html'];
// CSS viewport sizes, not claims of testing physical devices.
const sizes = [[280,653],[320,568],[360,800],[375,667],[390,844],[393,852],[412,915],[430,932],[480,800],[568,320],[667,375],[844,390],[768,1024],[820,1180],[1024,768],[1280,720],[1366,768],[1440,900],[1920,1080],[2560,1440],[3440,1440]];

async function expectReflow(page) {
	const overflow = await page.evaluate(() => ({
		width: document.documentElement.clientWidth,
		scroll: document.documentElement.scrollWidth,
		offenders: [...document.querySelectorAll('main *, header *, footer *')].filter(el => {
			const r = el.getBoundingClientRect();
			return r.width && (r.right > innerWidth + 1 || r.left < -1) && getComputedStyle(el).visibility !== 'hidden';
		}).slice(0, 8).map(el => el.className),
	}));
	expect(overflow.scroll, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width + 1);
	expect(overflow.offenders, JSON.stringify(overflow)).toEqual([]);
}

for (const route of routes) {
	test(`reflow ${route}`, async ({ page }) => {
		await page.goto(route);
		for (const [width,height] of sizes) {
			await page.setViewportSize({width,height});
			await expectReflow(page);
		}
		await page.setViewportSize({width:320,height:800});
		await page.addStyleTag({content: 'html { font-size: 200% !important; } * { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }'});
		await expectReflow(page);
	});
	test(`WCAG automated checks ${route}`, async ({page}) => {
		await page.setViewportSize({width:390,height:844});
		await page.goto(route);
		for (const theme of ['dark-green','light-blue','dark-blue']) {
			await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
			const result = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa','wcag2aaa']).analyze();
			expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})), theme).toEqual([]);
		}
	});
}

test('search, reset, URL restoration, keyboard and Japanese composition', async ({page}) => {
	await page.setViewportSize({width:320,height:568});
	await page.goto('/articles/');
	const input = page.getByRole('searchbox', {name:'記事を検索'});
	await expect(input).toBeVisible();
	await input.fill('存在しない検索語987654');
	await expect(page.locator('[data-no-results]')).toBeVisible();
	await page.getByRole('button', {name:'検索結果を見る'}).click();
	await expect(page.locator('[data-results-summary]')).toBeFocused();
	await page.getByRole('button', {name:'条件をクリア'}).click();
	await expect(input).toHaveValue('');
	await expect(page.locator('[data-no-results]')).toBeHidden();
	await input.fill('arch');
	await expect(page).toHaveURL(/q=arch/);
	await page.reload();
	await expect(input).toHaveValue('arch');
	await page.getByRole('button', {name:'条件をクリア'}).click();
	const total = await page.locator('[data-article-item]').count();
	await expect(page.locator('[data-result-count]')).toHaveText(`${total}件 / 全${total}件`);
	const initial = await page.locator('[data-result-count]').textContent();
	await input.dispatchEvent('compositionstart');
	await input.evaluate(el => { el.value = '存在しない検索語'; el.dispatchEvent(new InputEvent('input', {bubbles:true, isComposing:true})); });
	await expect(page.locator('[data-result-count]')).toHaveText(initial);
	await input.dispatchEvent('compositionend');
	await expect(page.locator('[data-no-results]')).toBeVisible();
	await page.goto('/');
	await page.keyboard.press('Tab');
	await expect(page.getByRole('link',{name:'本文へ移動'})).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(page.locator('#main-content')).toBeFocused();
});

test('article video has a named, usable destination instead of an invalid media source', async ({page}) => {
	await page.setViewportSize({width:320,height:568});
	await page.goto('/articles/arch1/');
	const link = page.getByRole('link',{name:'動画を見る：The Linux Tier List（YouTube）'});
	await expect(link).toHaveAttribute('href','https://www.youtube.com/watch?v=KyADkmRVe0U');
	expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(48);
	await expect(page.locator('video[src*="youtube.com/watch"]')).toHaveCount(0);
	await expectReflow(page);
});

test('no JavaScript still exposes every article and readable content', async ({browser}) => {
	const context = await browser.newContext({javaScriptEnabled:false, viewport:{width:320,height:568}});
	const page = await context.newPage();
	await page.goto('http://127.0.0.1:4321/articles/');
	await expect(page.locator('[data-article-item]').first()).toBeVisible();
	await expect(page.locator('[data-search-form]')).toBeHidden();
	await page.locator('.article-index-card h2 a').first().click();
	await expect(page.locator('h1')).toBeVisible();
	await expectReflow(page);
	await context.close();
});

test('primary controls meet 44px targets and theme menu releases keyboard focus', async ({page}) => {
	await page.setViewportSize({width:390,height:844});
	await page.goto('/articles/');
	for (const element of await page.locator('.site-header a, .site-header button, .article-explorer button, .article-explorer input, .article-explorer select, .article-index-card h2 a').all()) {
		if (!await element.isVisible()) continue;
		const r = await element.boundingBox();
		expect(r.height).toBeGreaterThanOrEqual(44);
		expect(r.width).toBeGreaterThanOrEqual(44);
	}
	await page.locator('[data-theme-trigger]').click();
	await page.keyboard.press('Escape');
	await expect(page.locator('[data-theme-trigger]')).toBeFocused();
	await expect(page.locator('[data-theme-menu]')).toBeHidden();
	await page.screenshot({path:test.info().outputPath('mobile-search.png'),fullPage:true});
	await page.locator('[data-theme-trigger]').click();
	await page.keyboard.press('Tab');
	await expect(page.locator('[data-theme-menu]')).toBeHidden();
	await page.setViewportSize({width:320,height:568});
	await page.addStyleTag({content:'html { font-size: 200% !important; }'});
	await page.locator('[data-theme-trigger]').click();
	await expectReflow(page);
});

test('touch navigation reaches article text and survives rotation', async ({browser, browserName}) => {
	const context = await browser.newContext({
		viewport:{width:390,height:844}, deviceScaleFactor:3,
		hasTouch:true, ...(browserName === 'firefox' ? {} : {isMobile:true}),
	});
	const page = await context.newPage();
	await page.goto('http://127.0.0.1:4321/');
	await page.getByRole('link', {name:'記事を探す',exact:true}).first().tap();
	await page.getByRole('searchbox').fill('arch');
	await page.getByRole('button', {name:'記事',exact:true}).tap();
	await page.getByRole('button', {name:'検索結果を見る'}).tap();
	await page.locator('[data-article-item]:not([hidden]) h2 a').first().tap();
	await expect(page.locator('.blog-prose')).toBeVisible();
	await expectReflow(page);
	await page.screenshot({path:test.info().outputPath('mobile-article.png'),fullPage:true});
	await page.setViewportSize({width:844,height:390});
	await expectReflow(page);
	await context.close();
});
