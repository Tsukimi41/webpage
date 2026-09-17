import {
	assertContentId,
	assertNonEmptyText,
	defineContentCollection,
	type ContentRecord,
} from '../core/content.ts';

export const TIMELINE_CATEGORIES = [
	'education',
	'project',
	'event',
	'award',
	'community',
	'work',
] as const;

export type TimelineCategory = (typeof TIMELINE_CATEGORIES)[number];

export interface TimelineDateDefinition {
	readonly year: number;
	readonly month?: number;
}

export interface TimelineEntryDefinition extends ContentRecord {
	readonly date: TimelineDateDefinition;
	readonly title: string;
	readonly description: string;
	readonly category: TimelineCategory;
	readonly projectIds: readonly string[];
}

function normalizeText(value: string, fieldPath: string): string {
	assertNonEmptyText(value, fieldPath);
	return value.trim();
}

function normalizeDate(
	date: TimelineDateDefinition,
	fieldPath: string,
): Readonly<TimelineDateDefinition> {
	if (!Number.isSafeInteger(date.year) || date.year < 1900 || date.year > 9999) {
		throw new Error(`${fieldPath}.year must be an integer from 1900 through 9999.`);
	}

	if (
		date.month !== undefined &&
		(!Number.isSafeInteger(date.month) || date.month < 1 || date.month > 12)
	) {
		throw new Error(`${fieldPath}.month must be an integer from 1 through 12.`);
	}

	return Object.freeze({ ...date });
}

function normalizeProjectIds(values: readonly string[], fieldPath: string): readonly string[] {
	const usedIds = new Set<string>();

	return Object.freeze(
		values.map((value, index) => {
			assertContentId(value, `${fieldPath}[${index}]`);

			if (usedIds.has(value)) {
				throw new Error(`${fieldPath} contains a duplicate project id: ${value}`);
			}

			usedIds.add(value);
			return value;
		}),
	);
}

export function defineTimelineCollection(
	records: readonly TimelineEntryDefinition[],
): readonly Readonly<TimelineEntryDefinition>[] {
	const contentRecords = defineContentCollection('timeline', records);

	return Object.freeze(
		contentRecords.map((record, index) => {
			const recordPath = `timeline[${index}]`;

			if (!TIMELINE_CATEGORIES.includes(record.category)) {
				throw new Error(`${recordPath}.category is unsupported: ${record.category}`);
			}

			return Object.freeze({
				...record,
				date: normalizeDate(record.date, `${recordPath}.date`),
				title: normalizeText(record.title, `${recordPath}.title`),
				description: normalizeText(record.description, `${recordPath}.description`),
				projectIds: normalizeProjectIds(record.projectIds, `${recordPath}.projectIds`),
			});
		}),
	);
}

export function assertTimelineProjectReferences(
	entries: readonly Readonly<TimelineEntryDefinition>[],
	projects: readonly Pick<ContentRecord, 'id' | 'state'>[],
): void {
	const projectsById = new Map(projects.map((project) => [project.id, project]));

	for (const entry of entries) {
		for (const projectId of entry.projectIds) {
			const project = projectsById.get(projectId);

			if (!project) {
				throw new Error(`Timeline entry ${entry.id} references an unknown project: ${projectId}`);
			}

			if (entry.state === 'published' && project.state !== 'published') {
				throw new Error(
					`Published timeline entry ${entry.id} references a non-published project: ${projectId}`,
				);
			}
		}
	}
}
