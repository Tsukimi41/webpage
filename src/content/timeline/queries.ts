import {
	PREVIEW_CONTENT_STATES,
	selectContentByState,
	type ContentState,
} from '../core/content.ts';
import type { TimelineEntryDefinition } from './timeline-entry.ts';
import { timelineEntries } from './timeline.ts';

export interface TimelineQuery {
	readonly states?: readonly ContentState[];
	readonly limit?: number;
	readonly direction?: 'ascending' | 'descending';
}

function assertOptionalLimit(limit: number | undefined): void {
	if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 0)) {
		throw new Error(`timeline query limit must be a non-negative safe integer: ${limit}`);
	}
}

export function selectTimelineEntries<T extends TimelineEntryDefinition>(
	records: readonly T[],
	query: TimelineQuery = {},
): readonly T[] {
	const { states = PREVIEW_CONTENT_STATES, limit, direction = 'descending' } = query;
	assertOptionalLimit(limit);

	if (direction !== 'ascending' && direction !== 'descending') {
		throw new Error(`timeline query direction is unsupported: ${direction}`);
	}

	const selectedEntries = [...selectContentByState(records, states)];

	if (direction === 'descending') {
		selectedEntries.reverse();
	}

	return Object.freeze(limit === undefined ? selectedEntries : selectedEntries.slice(0, limit));
}

export function getTimelineEntries(query: TimelineQuery = {}): readonly TimelineEntryDefinition[] {
	return selectTimelineEntries(timelineEntries, query);
}
