import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCANNED_EXTENSIONS = new Set(['.html', '.json', '.xml']);
const PRIVATE_STATE_PATTERN = /data-content-state=(?:"|')(mock|draft|archived)(?:"|')/g;
const MOCK_NOTICE_PATTERN = />\s*モックデータ\s*</;

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

export default function publicationGuard() {
	return {
		name: 'publication-guard',
		hooks: {
			'astro:build:done': async ({ dir }) => {
				await assertPublicationOutput(dir);
			},
		},
	};
}
