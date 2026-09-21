import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineSiteUrl, SITE_URL_ENV_NAME } from '../src/config/site.ts';
import { blogPosts, blogTags } from '../src/content/blog/index.ts';
import { profileDetails } from '../src/content/profile/index.ts';
import { projects } from '../src/content/projects/index.ts';
import { skills } from '../src/content/skills/index.ts';
import { socialLinks } from '../src/data/social-links.ts';
import { createReleaseReadinessReport } from '../src/publication/readiness.ts';
import { scanTextForSecretSignatures } from '../src/publication/security.ts';

const workspace = fileURLToPath(new URL('../', import.meta.url));
const sourceExtensions = new Set(['.astro', '.css', '.js', '.json', '.md', '.mjs', '.ts']);

async function collectTextFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			files.push(...await collectTextFiles(entryPath));
		} else if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) {
			files.push(entryPath);
		}
	}

	return files;
}

async function scanReleaseSources() {
	const files = [
		...await collectTextFiles(path.join(workspace, 'src')),
		path.join(workspace, 'astro.config.mjs'),
		path.join(workspace, 'package.json'),
	];
	const findings = [];

	for (const file of files) {
		const relativePath = path.relative(workspace, file).replaceAll(path.sep, '/');
		const source = await readFile(file, 'utf8');
		findings.push(...scanTextForSecretSignatures(relativePath, source));
	}

	return findings;
}

const siteUrl = defineSiteUrl(process.env[SITE_URL_ENV_NAME]);
const secretFindings = await scanReleaseSources();
const report = createReleaseReadinessReport({
	siteUrl,
	projects,
	skills,
	blogPosts,
	blogTags,
	profileDetails,
	socialLinks,
	secretFindings,
});

console.log(`Release readiness: ${report.ready ? 'READY' : 'BLOCKED'}`);
console.log(
	`published projects=${report.metrics.projects} skills=${report.metrics.skills} blogPosts=${report.metrics.blogPosts} blogTags=${report.metrics.blogTags} profileDetails=${report.metrics.profileDetails}`,
);
console.log(`secretFindings=${report.metrics.secretFindings}`);

for (const issue of report.issues) {
	console.log(`[${issue.severity.toUpperCase()}] ${issue.code} ${issue.scope}: ${issue.message}`);
}

if (!report.ready) {
	const blockerCount = report.issues.filter((issue) => issue.severity === 'blocker').length;
	throw new Error(`Release readiness check failed with ${blockerCount} blocker(s).`);
}
