import {
	assertContentId,
	assertNonEmptyText,
	defineContentCollection,
	type ContentRecord,
} from '../core/content.ts';

export interface BlogPostDefinition extends ContentRecord {
	readonly slug: string;
	readonly title: string;
	readonly description: string;
	readonly publishedAt: string;
	readonly updatedAt: string;
	readonly tagIds: readonly string[];
	readonly readingTimeMinutes: number;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeText(value: string, fieldPath: string): string {
	assertNonEmptyText(value, fieldPath);
	return value.trim();
}

function normalizeDate(value: string, fieldPath: string): string {
	const normalizedValue = normalizeText(value, fieldPath);

	if (!ISO_DATE_PATTERN.test(normalizedValue)) {
		throw new Error(`${fieldPath} must use YYYY-MM-DD format: ${value}`);
	}

	const [year, month, day] = normalizedValue.split('-').map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));

	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		throw new Error(`${fieldPath} must be a valid calendar date: ${value}`);
	}

	return normalizedValue;
}

function normalizeTagIds(tagIds: readonly string[], fieldPath: string): readonly string[] {
	const normalizedTagIds = tagIds.map((tagId, index) => {
		const normalizedTagId = normalizeText(tagId, `${fieldPath}[${index}]`);
		assertContentId(normalizedTagId, `${fieldPath}[${index}]`);
		return normalizedTagId;
	});
	const usedTagIds = new Set<string>();

	for (const tagId of normalizedTagIds) {
		if (usedTagIds.has(tagId)) {
			throw new Error(`${fieldPath} must not contain duplicate values: ${tagId}`);
		}

		usedTagIds.add(tagId);
	}

	return Object.freeze(normalizedTagIds);
}

function normalizeReadingTime(value: number, fieldPath: string): number {
	if (!Number.isSafeInteger(value) || value < 1) {
		throw new Error(`${fieldPath} must be a positive safe integer: ${value}`);
	}

	return value;
}

export function defineBlogPostCollection(
	records: readonly BlogPostDefinition[],
): readonly Readonly<BlogPostDefinition>[] {
	const contentRecords = defineContentCollection('blogPosts', records);
	const usedSlugs = new Set<string>();

	return Object.freeze(
		contentRecords.map((record, index) => {
			const recordPath = `blogPosts[${index}]`;
			assertContentId(record.slug, `${recordPath}.slug`);

			if (usedSlugs.has(record.slug)) {
				throw new Error(`blogPosts contains a duplicate slug: ${record.slug}`);
			}

			const publishedAt = normalizeDate(record.publishedAt, `${recordPath}.publishedAt`);
			const updatedAt = normalizeDate(record.updatedAt, `${recordPath}.updatedAt`);

			if (updatedAt < publishedAt) {
				throw new Error(`${recordPath}.updatedAt must not precede publishedAt.`);
			}

			usedSlugs.add(record.slug);

			return Object.freeze({
				...record,
				title: normalizeText(record.title, `${recordPath}.title`),
				description: normalizeText(record.description, `${recordPath}.description`),
				publishedAt,
				updatedAt,
				tagIds: normalizeTagIds(record.tagIds, `${recordPath}.tagIds`),
				readingTimeMinutes: normalizeReadingTime(
					record.readingTimeMinutes,
					`${recordPath}.readingTimeMinutes`,
				),
			});
		}),
	);
}
