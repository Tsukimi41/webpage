import {
	assertContentId,
	assertNonEmptyText,
	defineContentCollection,
	type ContentRecord,
} from '../core/content.ts';

export interface ProfileDetailItemDefinition {
	readonly id: string;
	readonly title: string;
	readonly description: string;
}

export interface ProfileContactDefinition {
	readonly label: string;
	readonly email: string;
	readonly note?: string;
}

export interface ProfileDetailDefinition extends ContentRecord {
	readonly summary: string;
	readonly biography: readonly string[];
	readonly interests: readonly ProfileDetailItemDefinition[];
	readonly principles: readonly ProfileDetailItemDefinition[];
	readonly contact?: ProfileContactDefinition;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeText(value: string, fieldPath: string): string {
	assertNonEmptyText(value, fieldPath);
	return value.trim();
}

function normalizeParagraphs(values: readonly string[], fieldPath: string): readonly string[] {
	if (values.length === 0) {
		throw new Error(`${fieldPath} must contain at least one paragraph.`);
	}

	return Object.freeze(values.map((value, index) => normalizeText(value, `${fieldPath}[${index}]`)));
}

function normalizeItems(
	items: readonly ProfileDetailItemDefinition[],
	fieldPath: string,
): readonly Readonly<ProfileDetailItemDefinition>[] {
	const usedIds = new Set<string>();

	return Object.freeze(
		items.map((item, index) => {
			const itemPath = `${fieldPath}[${index}]`;
			assertContentId(item.id, `${itemPath}.id`);

			if (usedIds.has(item.id)) {
				throw new Error(`${fieldPath} contains a duplicate id: ${item.id}`);
			}

			usedIds.add(item.id);
			return Object.freeze({
				id: item.id,
				title: normalizeText(item.title, `${itemPath}.title`),
				description: normalizeText(item.description, `${itemPath}.description`),
			});
		}),
	);
}

function normalizeContact(
	contact: ProfileContactDefinition | undefined,
	fieldPath: string,
): Readonly<ProfileContactDefinition> | undefined {
	if (!contact) return undefined;

	const email = normalizeText(contact.email, `${fieldPath}.email`);

	if (!EMAIL_PATTERN.test(email)) {
		throw new Error(`${fieldPath}.email must be a valid email address.`);
	}

	return Object.freeze({
		label: normalizeText(contact.label, `${fieldPath}.label`),
		email,
		note:
			contact.note === undefined
				? undefined
				: normalizeText(contact.note, `${fieldPath}.note`),
	});
}

export function defineProfileDetailCollection(
	records: readonly ProfileDetailDefinition[],
): readonly Readonly<ProfileDetailDefinition>[] {
	const contentRecords = defineContentCollection('profileDetails', records);

	return Object.freeze(
		contentRecords.map((record, index) => {
			const recordPath = `profileDetails[${index}]`;

			return Object.freeze({
				...record,
				summary: normalizeText(record.summary, `${recordPath}.summary`),
				biography: normalizeParagraphs(record.biography, `${recordPath}.biography`),
				interests: normalizeItems(record.interests, `${recordPath}.interests`),
				principles: normalizeItems(record.principles, `${recordPath}.principles`),
				contact: normalizeContact(record.contact, `${recordPath}.contact`),
			});
		}),
	);
}
