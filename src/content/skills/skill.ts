import {
	assertContentId,
	assertNonEmptyText,
	defineContentCollection,
	type ContentRecord,
} from '../core/content.ts';

export const SKILL_CATEGORIES = ['language', 'framework', 'styling', 'tool'] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export interface SkillDefinition extends ContentRecord {
	readonly label: string;
	readonly category: SkillCategory;
	readonly summary: string;
}

function normalizeText(value: string, fieldPath: string): string {
	assertNonEmptyText(value, fieldPath);
	return value.trim();
}

function assertSkillCategory(
	value: string,
	fieldPath: string,
): asserts value is SkillCategory {
	if (!SKILL_CATEGORIES.includes(value as SkillCategory)) {
		throw new Error(`${fieldPath} has an unsupported skill category: ${value}`);
	}
}

export function defineSkillCollection(
	records: readonly SkillDefinition[],
): readonly Readonly<SkillDefinition>[] {
	const contentRecords = defineContentCollection('skills', records);
	const usedLabels = new Set<string>();

	return Object.freeze(
		contentRecords.map((record, index) => {
			const recordPath = `skills[${index}]`;
			assertContentId(record.id, `${recordPath}.id`);
			assertSkillCategory(record.category, `${recordPath}.category`);

			const label = normalizeText(record.label, `${recordPath}.label`);
			const normalizedLabel = label.toLocaleLowerCase('en-US');

			if (usedLabels.has(normalizedLabel)) {
				throw new Error(`skills contains a duplicate label: ${label}`);
			}

			usedLabels.add(normalizedLabel);

			return Object.freeze({
				...record,
				label,
				summary: normalizeText(record.summary, `${recordPath}.summary`),
			});
		}),
	);
}
