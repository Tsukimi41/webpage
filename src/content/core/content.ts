export const CONTENT_STATES = Object.freeze(['mock', 'draft', 'published', 'archived'] as const);

export type ContentState = (typeof CONTENT_STATES)[number];
export type ContentVisibility = 'preview' | 'public';

export const PREVIEW_CONTENT_STATES = Object.freeze(
	['mock', 'draft', 'published'] as const satisfies readonly ContentState[],
);
export const PUBLIC_CONTENT_STATES = Object.freeze(
	['published'] as const satisfies readonly ContentState[],
);

export const ACTIVE_CONTENT_VISIBILITY: ContentVisibility = import.meta.env?.PROD
	? 'public'
	: 'preview';

export function assertContentVisibility(
	value: string,
	fieldPath = 'content visibility',
): asserts value is ContentVisibility {
	if (value !== 'preview' && value !== 'public') {
		throw new Error(`${fieldPath} has an unsupported value: ${value}`);
	}
}

export function getContentStatesForVisibility(
	visibility: ContentVisibility,
): readonly ContentState[] {
	assertContentVisibility(visibility);
	return visibility === 'public' ? PUBLIC_CONTENT_STATES : PREVIEW_CONTENT_STATES;
}

export const ACTIVE_CONTENT_STATES = getContentStatesForVisibility(ACTIVE_CONTENT_VISIBILITY);

export interface ContentRecord {
	readonly id: string;
	readonly state: ContentState;
	readonly order: number;
}

const CONTENT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function assertNonEmptyText(value: string, fieldPath: string): void {
	if (value.trim() === '') {
		throw new Error(`${fieldPath} must not be empty.`);
	}
}

export function assertContentId(value: string, fieldPath: string): void {
	assertNonEmptyText(value, fieldPath);

	if (!CONTENT_ID_PATTERN.test(value)) {
		throw new Error(`${fieldPath} must use lowercase kebab-case: ${value}`);
	}
}

export function assertContentState(value: string, fieldPath: string): asserts value is ContentState {
	if (!CONTENT_STATES.includes(value as ContentState)) {
		throw new Error(`${fieldPath} has an unsupported content state: ${value}`);
	}
}

export function assertContentStatesAllowed(
	states: readonly ContentState[],
	visibility: ContentVisibility = ACTIVE_CONTENT_VISIBILITY,
	fieldPath = 'content states',
): void {
	assertContentVisibility(visibility);
	const usedStates = new Set<ContentState>();

	for (const state of states) {
		assertContentState(state, fieldPath);

		if (usedStates.has(state)) {
			throw new Error(`${fieldPath} must not contain duplicate states: ${state}`);
		}

		if (visibility === 'public' && state !== 'published') {
			throw new Error(`${fieldPath} cannot expose ${state} content in a public build.`);
		}

		usedStates.add(state);
	}
}

export function assertOrder(value: number, fieldPath: string): void {
	if (!Number.isSafeInteger(value) || value < 0) {
		throw new Error(`${fieldPath} must be a non-negative safe integer: ${value}`);
	}
}

export function defineContentCollection<T extends ContentRecord>(
	collectionName: string,
	records: readonly T[],
): readonly Readonly<T>[] {
	assertNonEmptyText(collectionName, 'collectionName');

	const usedIds = new Set<string>();

	const validatedRecords = records.map((record, index) => {
		const recordPath = `${collectionName}[${index}]`;

		assertContentId(record.id, `${recordPath}.id`);
		assertContentState(record.state, `${recordPath}.state`);
		assertOrder(record.order, `${recordPath}.order`);

		if (usedIds.has(record.id)) {
			throw new Error(`${collectionName} contains a duplicate id: ${record.id}`);
		}

		usedIds.add(record.id);
		return Object.freeze({ ...record });
	});

	return Object.freeze(validatedRecords);
}

export function selectContentByState<T extends ContentRecord>(
	records: readonly T[],
	states: readonly ContentState[],
): readonly T[] {
	assertContentStatesAllowed(states);
	const allowedStates = new Set<ContentState>(states);

	return Object.freeze(
		records
			.filter((record) => allowedStates.has(record.state))
			.sort((left, right) => left.order - right.order || left.id.localeCompare(right.id)),
	);
}
