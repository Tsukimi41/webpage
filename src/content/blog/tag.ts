import {
	assertContentId,
	assertNonEmptyText,
	defineContentCollection,
	type ContentRecord,
} from '../core/content.ts';

export interface BlogTagDefinition extends ContentRecord {
	readonly label: string;
	readonly description: string;
}

function normalizeText(value: string, fieldPath: string): string {
	assertNonEmptyText(value, fieldPath);
	return value.trim();
}

export function defineBlogTagCollection(
	records: readonly BlogTagDefinition[],
): readonly Readonly<BlogTagDefinition>[] {
	const contentRecords = defineContentCollection('blogTags', records);
	const usedLabels = new Set<string>();

	return Object.freeze(
		contentRecords.map((record, index) => {
			const recordPath = `blogTags[${index}]`;
			assertContentId(record.id, `${recordPath}.id`);

			const label = normalizeText(record.label, `${recordPath}.label`);
			const comparisonKey = label.toLocaleLowerCase();

			if (usedLabels.has(comparisonKey)) {
				throw new Error(`blogTags contains a duplicate label: ${label}`);
			}

			usedLabels.add(comparisonKey);

			return Object.freeze({
				...record,
				label,
				description: normalizeText(record.description, `${recordPath}.description`),
			});
		}),
	);
}
