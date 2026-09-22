import {
	CONTENT_STATES,
	assertContentState,
	assertNonEmptyText,
	type ContentRecord,
	type ContentState,
} from './content.ts';

export interface PublicationGroup<T extends ContentRecord = ContentRecord> {
	readonly name: string;
	readonly records: readonly T[];
}

export interface PublicationGroupReport {
	readonly name: string;
	readonly total: number;
	readonly public: number;
	readonly private: number;
	readonly states: Readonly<Record<ContentState, number>>;
}

export interface PublicationReport {
	readonly total: number;
	readonly public: number;
	readonly private: number;
	readonly states: Readonly<Record<ContentState, number>>;
	readonly groups: readonly Readonly<PublicationGroupReport>[];
}

function createEmptyStateCounts(): Record<ContentState, number> {
	return { mock: 0, draft: 0, published: 0, archived: 0 };
}

function freezeStateCounts(
	counts: Record<ContentState, number>,
): Readonly<Record<ContentState, number>> {
	return Object.freeze({ ...counts });
}

export function assertPublicContentSelection(
	groups: readonly PublicationGroup[],
): void {
	for (const group of groups) {
		assertNonEmptyText(group.name, 'publication group name');

		for (const record of group.records) {
			assertContentState(record.state, `${group.name}.${record.id}.state`);

			if (record.state !== 'published') {
				throw new Error(
					`Public selection ${group.name} contains ${record.state} content: ${record.id}`,
				);
			}
		}
	}
}

export function createPublicationReport(
	groups: readonly PublicationGroup[],
): Readonly<PublicationReport> {
	const usedNames = new Set<string>();
	const totalStates = createEmptyStateCounts();

	const groupReports = groups.map((group, groupIndex) => {
		assertNonEmptyText(group.name, `publication groups[${groupIndex}].name`);
		const name = group.name.trim();

		if (usedNames.has(name)) {
			throw new Error(`Publication report contains a duplicate group: ${name}`);
		}

		usedNames.add(name);
		const states = createEmptyStateCounts();

		for (const record of group.records) {
			assertContentState(record.state, `${name}.${record.id}.state`);
			states[record.state] += 1;
			totalStates[record.state] += 1;
		}

		const total = CONTENT_STATES.reduce((sum, state) => sum + states[state], 0);
		const published = states.published;

		return Object.freeze({
			name,
			total,
			public: published,
			private: total - published,
			states: freezeStateCounts(states),
		});
	});

	const total = CONTENT_STATES.reduce((sum, state) => sum + totalStates[state], 0);
	const published = totalStates.published;

	return Object.freeze({
		total,
		public: published,
		private: total - published,
		states: freezeStateCounts(totalStates),
		groups: Object.freeze(groupReports),
	});
}
