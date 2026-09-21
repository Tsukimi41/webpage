import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import {
	ACTIVE_CONTENT_STATES,
	ACTIVE_CONTENT_VISIBILITY,
	PREVIEW_CONTENT_STATES,
	PUBLIC_CONTENT_STATES,
	assertContentStatesAllowed,
	assertContentVisibility,
	getContentStatesForVisibility,
} from '../src/content/core/content.ts';
import {
	assertPublicContentSelection,
	createPublicationReport,
} from '../src/content/core/publication.ts';
import {
	assertPublicationOutput,
	findPrivateContentMarkers,
} from '../src/integrations/publication-guard.mjs';

const publishedRecord = { id: 'published-item', state: 'published', order: 0 };
const mockRecord = { id: 'mock-item', state: 'mock', order: 1 };
const draftRecord = { id: 'draft-item', state: 'draft', order: 2 };
const archivedRecord = { id: 'archived-item', state: 'archived', order: 3 };

test('Node and development use preview states while public visibility is published-only', () => {
	assert.equal(ACTIVE_CONTENT_VISIBILITY, 'preview');
	assert.equal(ACTIVE_CONTENT_STATES, PREVIEW_CONTENT_STATES);
	assert.equal(getContentStatesForVisibility('preview'), PREVIEW_CONTENT_STATES);
	assert.equal(getContentStatesForVisibility('public'), PUBLIC_CONTENT_STATES);
	assert.deepEqual(PUBLIC_CONTENT_STATES, ['published']);
	assert.ok(Object.isFrozen(PREVIEW_CONTENT_STATES));
	assert.ok(Object.isFrozen(PUBLIC_CONTENT_STATES));
});

test('content visibility rejects unsupported runtime values', () => {
	assert.throws(() => assertContentVisibility('private'), /unsupported value/);
	assert.throws(() => getContentStatesForVisibility('private'), /unsupported value/);
	assert.throws(
		() => assertContentStatesAllowed(['published'], 'private'),
		/unsupported value/,
	);
});

test('public state guard accepts zero and published states but rejects private or duplicate states', () => {
	assert.doesNotThrow(() => assertContentStatesAllowed([], 'public'));
	assert.doesNotThrow(() => assertContentStatesAllowed(['published'], 'public'));

	for (const state of ['mock', 'draft', 'archived']) {
		assert.throws(
			() => assertContentStatesAllowed([state], 'public', 'test states'),
			/public build/,
		);
	}

	assert.throws(
		() => assertContentStatesAllowed(['published', 'published'], 'public'),
		/duplicate states/,
	);
});

test('publication report handles zero, one, and multiple records deterministically', () => {
	const report = createPublicationReport([
		{ name: 'empty', records: [] },
		{ name: 'single', records: [publishedRecord] },
		{ name: 'multiple', records: [mockRecord, draftRecord, archivedRecord] },
	]);

	assert.equal(report.total, 4);
	assert.equal(report.public, 1);
	assert.equal(report.private, 3);
	assert.deepEqual(report.states, {
		mock: 1,
		draft: 1,
		published: 1,
		archived: 1,
	});
	assert.deepEqual(report.groups.map(({ name }) => name), ['empty', 'single', 'multiple']);
	assert.ok(Object.isFrozen(report));
	assert.ok(Object.isFrozen(report.states));
	assert.ok(Object.isFrozen(report.groups));
	assert.ok(Object.isFrozen(report.groups[0]));
});

test('publication report rejects invalid and duplicate group definitions', () => {
	assert.throws(() => createPublicationReport([{ name: ' ', records: [] }]), /must not be empty/);
	assert.throws(
		() => createPublicationReport([
			{ name: 'same', records: [] },
			{ name: 'same', records: [] },
		]),
		/duplicate group/,
	);
	assert.throws(
		() => createPublicationReport([{ name: 'invalid', records: [{ id: 'bad', state: 'hidden', order: 0 }] }]),
		/unsupported content state/,
	);
});

test('public selection rejects every non-published record and accepts omitted groups', () => {
	assert.doesNotThrow(() => assertPublicContentSelection([]));
	assert.doesNotThrow(() =>
		assertPublicContentSelection([{ name: 'published', records: [publishedRecord] }]),
	);

	for (const record of [mockRecord, draftRecord, archivedRecord]) {
		assert.throws(
			() => assertPublicContentSelection([{ name: 'private', records: [record] }]),
			/Public selection private contains/,
		);
	}
});

test('output marker detection catches every private state and the visible mock notice', () => {
	assert.deepEqual(findPrivateContentMarkers('<main data-content-state="published"></main>'), []);
	assert.deepEqual(
		findPrivateContentMarkers(
			'<main data-content-state="mock"></main><p>モックデータ</p><i data-content-state="draft"></i>',
		),
		['content state: mock', 'content state: draft', 'mock content notice'],
	);
	assert.deepEqual(
		findPrivateContentMarkers("<main data-content-state='archived'></main>"),
		['content state: archived'],
	);
});

test('publication output guard scans nested output and fails on private content', async (context) => {
	const outputDirectory = await mkdtemp(path.join(tmpdir(), 'publication-guard-'));
	context.after(() => rm(outputDirectory, { recursive: true, force: true }));
	const nestedDirectory = path.join(outputDirectory, 'nested');
	await mkdir(nestedDirectory);
	const directoryUrl = pathToFileURL(`${outputDirectory}${path.sep}`);

	await writeFile(path.join(outputDirectory, 'index.html'), '<main>Published page</main>');
	await assert.doesNotReject(() => assertPublicationOutput(directoryUrl));

	await writeFile(
		path.join(nestedDirectory, 'index.html'),
		'<article data-content-state="draft">Private</article>',
	);
	await assert.rejects(() => assertPublicationOutput(directoryUrl), /nested.*draft/s);
});

test('every content-rendering component exposes its state to the output guard', async () => {
	const componentUrls = [
		'../src/components/ArticleFeedCard.astro',
		'../src/components/ArticleIndexCard.astro',
		'../src/components/BlogArticle.astro',
		'../src/components/BlogCard.astro',
		'../src/components/ProfileDetails.astro',
		'../src/components/ProjectCard.astro',
		'../src/components/ProjectDetail.astro',
		'../src/components/SkillShowcase.astro',
	];

	for (const componentUrl of componentUrls) {
		const source = await readFile(new URL(componentUrl, import.meta.url), 'utf8');
		assert.match(source, /data-content-state=/, componentUrl);
	}
});
