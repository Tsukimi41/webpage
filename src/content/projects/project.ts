import {
	assertContentId,
	assertNonEmptyText,
	defineContentCollection,
	type ContentRecord,
} from '../core/content.ts';

export type ProjectHref = `https://${string}` | `/${string}`;

export interface ProjectLinkDefinition {
	readonly id: string;
	readonly label: string;
	readonly href: ProjectHref;
}

export interface ProjectDefinition extends ContentRecord {
	readonly slug: string;
	readonly title: string;
	readonly summary: string;
	readonly period: string;
	readonly role: string;
	readonly technologyLabels: readonly string[];
	readonly featured: boolean;
	readonly links: readonly ProjectLinkDefinition[];
}

function normalizeText(value: string, fieldPath: string): string {
	assertNonEmptyText(value, fieldPath);
	return value.trim();
}

function normalizeTextList(values: readonly string[], fieldPath: string): readonly string[] {
	if (values.length === 0) {
		throw new Error(`${fieldPath} must contain at least one item.`);
	}

	const normalizedValues = values.map((value, index) =>
		normalizeText(value, `${fieldPath}[${index}]`),
	);
	const uniqueValues = new Set(normalizedValues);

	if (uniqueValues.size !== normalizedValues.length) {
		throw new Error(`${fieldPath} must not contain duplicate values.`);
	}

	return Object.freeze(normalizedValues);
}

function normalizeProjectHref(href: string, fieldPath: string): ProjectHref {
	if (href.startsWith('/')) {
		if (href.startsWith('//') || /\s/.test(href)) {
			throw new Error(`${fieldPath} must be a valid site-relative path: ${href}`);
		}

		return href as `/${string}`;
	}

	let url: URL;

	try {
		url = new URL(href);
	} catch {
		throw new Error(`${fieldPath} must be an HTTPS URL or site-relative path: ${href}`);
	}

	if (url.protocol !== 'https:' || url.username || url.password) {
		throw new Error(`${fieldPath} must be a credential-free HTTPS URL: ${href}`);
	}

	return url.href as `https://${string}`;
}

function normalizeLinks(
	links: readonly ProjectLinkDefinition[],
	fieldPath: string,
): readonly Readonly<ProjectLinkDefinition>[] {
	const usedIds = new Set<string>();

	return Object.freeze(
		links.map((link, index) => {
			const linkPath = `${fieldPath}[${index}]`;
			assertContentId(link.id, `${linkPath}.id`);

			if (usedIds.has(link.id)) {
				throw new Error(`${fieldPath} contains a duplicate id: ${link.id}`);
			}

			usedIds.add(link.id);

			return Object.freeze({
				id: link.id,
				label: normalizeText(link.label, `${linkPath}.label`),
				href: normalizeProjectHref(link.href, `${linkPath}.href`),
			});
		}),
	);
}

export function defineProjectCollection(
	records: readonly ProjectDefinition[],
): readonly Readonly<ProjectDefinition>[] {
	const contentRecords = defineContentCollection('projects', records);
	const usedSlugs = new Set<string>();

	return Object.freeze(
		contentRecords.map((record, index) => {
			const recordPath = `projects[${index}]`;
			assertContentId(record.slug, `${recordPath}.slug`);

			if (usedSlugs.has(record.slug)) {
				throw new Error(`projects contains a duplicate slug: ${record.slug}`);
			}

			if (typeof record.featured !== 'boolean') {
				throw new Error(`${recordPath}.featured must be a boolean.`);
			}

			usedSlugs.add(record.slug);

			return Object.freeze({
				...record,
				title: normalizeText(record.title, `${recordPath}.title`),
				summary: normalizeText(record.summary, `${recordPath}.summary`),
				period: normalizeText(record.period, `${recordPath}.period`),
				role: normalizeText(record.role, `${recordPath}.role`),
				technologyLabels: normalizeTextList(
					record.technologyLabels,
					`${recordPath}.technologyLabels`,
				),
				links: normalizeLinks(record.links, `${recordPath}.links`),
			});
		}),
	);
}
