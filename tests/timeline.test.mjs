import assert from 'node:assert/strict';
import test from 'node:test';

import { projects } from '../src/content/projects/index.ts';
import {
	assertTimelineProjectReferences,
	defineTimelineCollection,
	getTimelineEntries,
	selectTimelineEntries,
	timelineEntries,
} from '../src/content/timeline/index.ts';

const validEntry = Object.freeze({
	id: 'test-entry',
	state: 'mock',
	order: 0,
	date: { year: 2026, month: 9 },
	title: 'Test entry',
	description: 'Test description.',
	category: 'project',
	projectIds: ['mock-learning-log'],
});

test('timeline data is deeply frozen', () => {
	assert.equal(Object.isFrozen(timelineEntries), true);

	for (const entry of timelineEntries) {
		assert.equal(Object.isFrozen(entry), true);
		assert.equal(Object.isFrozen(entry.date), true);
		assert.equal(Object.isFrozen(entry.projectIds), true);
	}
});

test('timeline query supports direction, states, and limits', () => {
	assert.deepEqual(
		getTimelineEntries({ limit: 2 }).map((entry) => entry.id),
		['mock-learning-log-release', 'mock-campus-guide-release'],
	);
	assert.deepEqual(
		getTimelineEntries({ direction: 'ascending', limit: 2 }).map((entry) => entry.id),
		['mock-web-foundation', 'mock-command-notes-release'],
	);
	assert.deepEqual(getTimelineEntries({ limit: 0 }), []);
	assert.equal(Object.isFrozen(getTimelineEntries()), true);

	const records = defineTimelineCollection([
		validEntry,
		{ ...validEntry, id: 'published-entry', state: 'published', order: 1 },
	]);
	assert.deepEqual(
		selectTimelineEntries(records, { states: ['published'] }).map((entry) => entry.id),
		['published-entry'],
	);
});

test('timeline query rejects invalid limits and directions', () => {
	for (const limit of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
		assert.throws(() => getTimelineEntries({ limit }), /non-negative safe integer/);
	}

	assert.throws(
		() => getTimelineEntries({ direction: 'sideways' }),
		/unsupported/,
	);
});

test('timeline validation rejects malformed fields', () => {
	const invalidEntries = [
		{ ...validEntry, title: ' ' },
		{ ...validEntry, description: '' },
		{ ...validEntry, category: 'unknown' },
		{ ...validEntry, date: { year: 1899 } },
		{ ...validEntry, date: { year: 2026, month: 13 } },
		{ ...validEntry, projectIds: ['mock-learning-log', 'mock-learning-log'] },
		{ ...validEntry, projectIds: ['Invalid Project'] },
	];

	for (const entry of invalidEntries) {
		assert.throws(() => defineTimelineCollection([entry]));
	}
});

test('timeline project references reject missing and unsafe published targets', () => {
	assert.doesNotThrow(() => assertTimelineProjectReferences([validEntry], projects));
	assert.throws(
		() =>
			assertTimelineProjectReferences(
				[{ ...validEntry, projectIds: ['missing-project'] }],
				projects,
			),
		/unknown project/,
	);
	assert.throws(
		() =>
			assertTimelineProjectReferences(
				[{ ...validEntry, state: 'published' }],
				projects,
			),
		/non-published project/,
	);
});
