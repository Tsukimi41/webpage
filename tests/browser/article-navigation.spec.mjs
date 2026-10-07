import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const visibleSlides = '[data-carousel-slide]:not([hidden])';
const visibleResults = '[data-article-item]:not([hidden])';

// Inject larger fixtures before deferred application scripts initialize.
async function withArticleCount(page, count) {
	await page.route('**/*', async route => {
		if (route.request().resourceType() !== 'document') return route.continue();
		const response = await route.fetch();
		const fixture = `(${((count) => {
			const slides = document.querySelector('#article-carousel-slides');
			const select = document.querySelector('[data-carousel-select]');
			if (slides && select) {
				const template = slides.firstElementChild.cloneNode(true);
				slides.replaceChildren(); select.replaceChildren();
				for (let i = 0; i < count; i++) {
					const slide = template.cloneNode(true);
					slide.hidden = i !== 0;
					slide.setAttribute('aria-label', `${i + 1} / ${count}件`);
					slide.querySelector('h3').textContent = `検証記事 ${i + 1}`;
					slides.append(slide);
					select.add(new Option(`検証記事 ${i + 1}`, String(i)));
				}
				document.querySelector('[data-carousel-position]').textContent = `1 / ${count}件`;
			}
			const list = document.querySelector('#article-results');
			if (list) {
				const template = list.firstElementChild.cloneNode(true);
				list.replaceChildren();
				for (let i = 0; i < count; i++) {
					const item = template.cloneNode(true);
					item.dataset.search = `検証記事 ${i + 1} ${i === count - 1 ? '最後の検索語' : ''}`;
					item.querySelector('h2 a').textContent = `検証記事 ${i + 1}`;
					list.append(item);
				}
			}
		}).toString()})(${count});`;
		await route.fulfill({response, body:(await response.text()).replace('</body>', `<script>${fixture}</script></body>`)});
	});
}

test('carousel cycles in both directions, supports selection and keeps keyboard focus', async ({page}) => {
	await page.setViewportSize({width:320,height:568});
	await page.goto('/');
	const slides = page.locator('[data-carousel-slide]');
	const total = await slides.count();
	expect(total).toBeGreaterThan(1);
	const previous = page.getByRole('button', {name:'前の記事',exact:true});
	const next = page.getByRole('button', {name:'次の記事',exact:true});
	await expect(page.locator(visibleSlides)).toHaveCount(1);
	await previous.focus();
	await page.keyboard.press('Enter');
	await expect(slides.last()).toBeVisible();
	await expect(previous).toBeFocused();
	await expect(page.locator('[data-carousel-position]')).toHaveText(`${total} / ${total}件`);
	await next.click();
	await expect(slides.first()).toBeVisible();
	await page.getByLabel('記事名から選ぶ').selectOption('1');
	await expect(slides.nth(1)).toBeVisible();
	await expect(page.locator('[data-carousel-slide][hidden] a:visible')).toHaveCount(0);
	await page.getByLabel('記事名から選ぶ').focus();
	await page.keyboard.press('Tab');
	await expect(slides.nth(1).getByRole('link')).toBeFocused();
	for (const control of [previous, next, page.getByLabel('記事名から選ぶ')]) {
		const box = await control.boundingBox();
		expect(box.width).toBeGreaterThanOrEqual(44);
		expect(box.height).toBeGreaterThanOrEqual(48);
	}
	await slides.nth(1).getByRole('link').hover();
	for (const theme of ['dark-green', 'light-blue', 'dark-blue']) {
		await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
		const result = await new AxeBuilder({page}).include('[data-article-carousel]').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa','wcag2aaa']).analyze();
		expect(result.violations).toEqual([]);
	}
	await page.evaluate(() => document.documentElement.dataset.theme = 'dark-green');
	await page.locator('[data-article-carousel]').evaluate(el => el.scrollIntoView({block:'start'}));
	expect(await page.locator('.skip-link').evaluate(el => el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(0);
	await page.screenshot({path:test.info().outputPath('mobile-carousel.png')});
	await page.setViewportSize({width:1440,height:900});
	await page.locator('[data-article-carousel]').evaluate(el => el.scrollIntoView({block:'start'}));
	await page.screenshot({path:test.info().outputPath('desktop-carousel.png')});
});

test('60 articles do not increase the carousel height and every article can be reached', async ({page}) => {
	await page.setViewportSize({width:390,height:844});
	await page.goto('/');
	const originalHeight = (await page.locator('[data-article-carousel]').boundingBox()).height;
	await withArticleCount(page, 60);
	await page.goto('/');
	await expect(page.locator('[data-carousel-slide]')).toHaveCount(60);
	expect((await page.locator('[data-article-carousel]').boundingBox()).height).toBeLessThanOrEqual(originalHeight + 1);
	for (let i = 0; i < 60; i++) {
		await expect(page.locator(visibleSlides)).toHaveCount(1);
		await expect(page.locator(`${visibleSlides} h3`)).toHaveText(`検証記事 ${i + 1}`);
		await page.getByRole('button', {name:'次の記事',exact:true}).click();
	}
	await expect(page.locator(`${visibleSlides} h3`)).toHaveText('検証記事 1');
});

test('a single article needs no carousel controls', async ({page}) => {
	await withArticleCount(page, 1);
	await page.goto('/');
	await expect(page.locator(visibleSlides)).toHaveCount(1);
	await expect(page.locator('[data-carousel-controls]')).toBeHidden();
	await expect(page.locator(`${visibleSlides} a`)).toBeVisible();
});

test('all slides reflow with enlarged text and touch works in either orientation', async ({browser, browserName}) => {
	const context = await browser.newContext({viewport:{width:390,height:844},hasTouch:true,...(browserName === 'firefox' ? {} : {isMobile:true})});
	const page = await context.newPage();
	await page.goto('http://127.0.0.1:4321/');
	const total = await page.locator('[data-carousel-slide]').count();
	for (const [width,height] of [[390,844],[844,390],[320,568]]) {
		await page.setViewportSize({width,height});
		if (width === 320) await page.addStyleTag({content:'html {font-size:200% !important} * {line-height:1.5 !important; letter-spacing:.12em !important; word-spacing:.16em !important} p {margin-bottom:2em !important}'});
		for (let i = 0; i < total; i++) {
			await page.getByRole('button', {name:'次の記事',exact:true}).tap();
			const overflow = await page.evaluate(() => [...document.querySelectorAll('[data-article-carousel], [data-article-carousel] *')].filter(el => {
				const r = el.getBoundingClientRect();
				return r.width && (r.right > innerWidth + 1 || r.left < -1);
			}).map(el => el.className));
			expect(overflow).toEqual([]);
			expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
		}
	}
	await context.close();
});

test('pagination bounds results, restores URLs, and searches across hidden pages', async ({page}) => {
	await withArticleCount(page, 60);
	await page.setViewportSize({width:320,height:568});
	await page.goto('/articles/');
	await expect(page.locator(visibleResults)).toHaveCount(6);
	await expect(page.getByRole('button',{name:'前のページ'})).toBeDisabled();
	await page.getByRole('button',{name:'次のページ'}).click();
	await expect(page.locator('[data-results-summary]')).toBeFocused();
	await expect(page).toHaveURL(/page=2/);
	await expect(page.locator(visibleResults).first()).toContainText('検証記事 7');
	await page.reload();
	await expect(page.locator(visibleResults).first()).toContainText('検証記事 7');
	await page.goto('/articles/?page=999');
	await expect(page.locator(visibleResults).last()).toContainText('検証記事 60');
	await expect(page.getByRole('button',{name:'次のページ'})).toBeDisabled();
	await page.getByRole('searchbox').fill('最後の検索語');
	await expect(page.locator(visibleResults)).toHaveCount(1);
	await expect(page.locator(visibleResults)).toContainText('検証記事 60');
	await expect(page.locator('[data-pagination]')).toBeHidden();
	await page.getByRole('searchbox').fill('存在しない検索語');
	await expect(page.locator(visibleResults)).toHaveCount(0);
	await expect(page.locator('[data-no-results]')).toBeVisible();
	await page.getByRole('button',{name:'条件をクリア'}).click();
	await expect(page.locator(visibleResults)).toHaveCount(6);
	await expect(page.locator(visibleResults).first()).toContainText('検証記事 1');
});

test('without JavaScript the compact home still links to the complete article list', async ({browser}) => {
	const context = await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:568}});
	const page = await context.newPage();
	await page.goto('http://127.0.0.1:4321/');
	await expect(page.locator(visibleSlides)).toHaveCount(1);
	await expect(page.locator('[data-carousel-controls]')).toBeHidden();
	await page.getByRole('link',{name:'すべての記事を見る',exact:true}).click();
	const total = await page.locator('[data-article-item]').count();
	await expect(page.locator(visibleResults)).toHaveCount(total);
	await context.close();
});
