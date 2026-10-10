import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

// Build with the deployment base path, but serve and audit only loopback URLs.
process.env.PUBLIC_SITE_URL ||= 'https://tsukimi41.github.io/webpage/';
process.env.ASTRO_TELEMETRY_DISABLED = '1';
const { build, preview } = await import('astro');
await build({ logLevel: 'warn' });
const server = await preview({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'warn' });
const output = new URL('../.lighthouse/', import.meta.url);
const cli = fileURLToPath(new URL('../node_modules/lighthouse/cli/index.js', import.meta.url));
const pathname = new URL(process.env.PUBLIC_SITE_URL).pathname;
const base = pathname.endsWith('/') ? pathname : `${pathname}/`;
const summary = [];
try {
	await mkdir(output, { recursive: true });
	for (const [name, route] of [['home', ''], ['articles', 'articles/']]) {
		const url = `http://127.0.0.1:${server.port}${base}${route}`;
		console.log(`Auditing ${url} (mobile, simulated throttling)`);
		const outputPath = fileURLToPath(new URL(name, output));
		await promisify(execFile)(process.execPath, [cli, url,
			'--quiet', '--output=json', '--output=html', `--output-path=${outputPath}`,
			'--only-categories=performance,accessibility,best-practices,seo',
			`--chrome-flags=--headless${process.env.CI ? ' --no-sandbox' : ''}`,
		], { env: { ...process.env, CHROME_PATH: chromium.executablePath() }, windowsHide: true, timeout: 180_000, maxBuffer: 10 * 1024 * 1024 });
		const report = JSON.parse(await readFile(new URL(`${name}.report.json`, output), 'utf8'));
		if (report.runtimeError) throw new Error(`${name}: ${report.runtimeError.message}`);
		const scores = Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, Math.round(value.score * 100)]));
		summary.push({ page: name, lighthouseVersion: report.lighthouseVersion, scores,
			lcpMs: Math.round(report.audits['largest-contentful-paint'].numericValue),
			speedIndexMs: Math.round(report.audits['speed-index'].numericValue),
			cls: report.audits['cumulative-layout-shift'].numericValue,
			tbtMs: Math.round(report.audits['total-blocking-time'].numericValue),
		});
		console.log(JSON.stringify(summary.at(-1)));
	}
	await writeFile(new URL('summary.json', output), JSON.stringify(summary, null, 2) + '\n');
	// Catch major regressions while allowing normal variation between machines.
	if (summary.some(({ scores }) => scores.performance < 80 || scores.accessibility < 90 || scores['best-practices'] < 90 || scores.seo < 90)) {
		throw new Error('Lighthouse budget failed. Inspect .lighthouse/*.report.html.');
	}
} finally {
	await server.stop();
}
