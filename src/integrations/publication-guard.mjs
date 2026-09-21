import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCANNED_EXTENSIONS = new Set(['.html', '.json', '.xml']);
const PRIVATE_STATE_PATTERN = /data-content-state=(?:"|')(mock|draft|archived)(?:"|')/g;
const MOCK_NOTICE_PATTERN = />\s*モックデータ\s*</;
const ROBOTS_NOINDEX_PATTERN = /<meta\b(?=[^>]*\bname=(?:"|')robots(?:"|'))(?=[^>]*\bcontent=(?:"|')noindex,\s*nofollow(?:"|'))[^>]*>/i;
const CANONICAL_PATTERN = /<link\b(?=[^>]*\brel=(?:"|')canonical(?:"|'))[^>]*>/i;
const OPEN_GRAPH_URL_PATTERN = /<meta\b(?=[^>]*\bproperty=(?:"|')og:url(?:"|'))[^>]*>/i;
const NOT_FOUND_HEADING_PATTERN = /<h1\b(?=[^>]*\bid=(?:"|')not-found-title(?:"|'))[^>]*>/i;

export function findPrivateContentMarkers(source) {
	const markers = [];

	for (const match of source.matchAll(PRIVATE_STATE_PATTERN)) {
		markers.push(`content state: ${match[1]}`);
	}

	if (MOCK_NOTICE_PATTERN.test(source)) {
		markers.push('mock content notice');
	}

	return Object.freeze(markers);
}

async function collectOutputFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			files.push(...await collectOutputFiles(entryPath));
		} else if (entry.isFile() && SCANNED_EXTENSIONS.has(path.extname(entry.name))) {
			files.push(entryPath);
		}
	}

	return files;
}

export async function assertPublicationOutput(directoryUrl) {
	const directory = fileURLToPath(directoryUrl);
	const files = await collectOutputFiles(directory);
	const leaks = [];

	for (const file of files) {
		const source = await readFile(file, 'utf8');
		const markers = findPrivateContentMarkers(source);

		if (markers.length > 0) {
			leaks.push(`${path.relative(directory, file)} (${markers.join(', ')})`);
		}
	}

	if (leaks.length > 0) {
		throw new Error(`Publication guard found private content:\n- ${leaks.join('\n- ')}`);
	}
}

export function findNotFoundOutputIssues(source) {
	const issues = [];

	if (!ROBOTS_NOINDEX_PATTERN.test(source)) issues.push('robots must be noindex, nofollow');
	if (CANONICAL_PATTERN.test(source)) issues.push('canonical must be omitted');
	if (OPEN_GRAPH_URL_PATTERN.test(source)) issues.push('og:url must be omitted');
	if (!NOT_FOUND_HEADING_PATTERN.test(source)) issues.push('custom 404 heading is missing');

	return Object.freeze(issues);
}

export async function assertNotFoundOutput(directoryUrl) {
	const notFoundPath = path.join(fileURLToPath(directoryUrl), '404.html');
	let source;

	try {
		source = await readFile(notFoundPath, 'utf8');
	} catch (error) {
		if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
			throw new Error('Output contract failed: 404.html is missing');
		}

		throw error;
	}

	const issues = findNotFoundOutputIssues(source);
	if (issues.length > 0) {
		throw new Error(`Output contract failed for 404.html:\n- ${issues.join('\n- ')}`);
	}
}

export default function publicationGuard() {
	return {
		name: 'publication-guard',
		hooks: {
			'astro:build:done': async ({ dir }) => {
				await assertPublicationOutput(dir);
				await assertNotFoundOutput(dir);
			},
		},
	};
}
