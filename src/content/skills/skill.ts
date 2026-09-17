import {
	assertContentId,
	assertNonEmptyText,
	defineContentCollection,
	type ContentRecord,
} from '../core/content.ts';

export const SKILL_CATEGORIES = ['language', 'framework', 'styling', 'tool'] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export type SkillPresentation = 'bubble' | 'marble';
export type SkillImageSource = `/${string}` | `https://${string}`;
export type SkillIconName = `${string}:${string}`;

export interface SkillIconVisualDefinition {
	readonly kind: 'icon';
	readonly name: SkillIconName;
}

export interface SkillImageVisualDefinition {
	readonly kind: 'image';
	readonly src: SkillImageSource;
	readonly alt: string;
	readonly width: number;
	readonly height: number;
	readonly sourceName?: string;
	readonly sourceUrl?: `https://${string}`;
	readonly license?: string;
}

export interface SkillTextVisualDefinition {
	readonly kind: 'text';
	readonly text: string;
}

export type SkillVisualDefinition =
	| SkillIconVisualDefinition
	| SkillImageVisualDefinition
	| SkillTextVisualDefinition;

export interface SkillDefinition extends ContentRecord {
	readonly label: string;
	readonly category: SkillCategory;
	readonly summary: string;
	readonly presentation: SkillPresentation;
	readonly visual: SkillVisualDefinition;
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

function normalizeHttpsUrl(value: string, fieldPath: string): `https://${string}` {
	let url: URL;

	try {
		url = new URL(value);
	} catch {
		throw new Error(`${fieldPath} must be a valid HTTPS URL: ${value}`);
	}

	if (url.protocol !== 'https:' || url.username || url.password) {
		throw new Error(`${fieldPath} must be a credential-free HTTPS URL: ${value}`);
	}

	return url.href as `https://${string}`;
}

function normalizeImageSource(value: string, fieldPath: string): SkillImageSource {
	if (value.startsWith('/')) {
		if (value.startsWith('//') || /\s/.test(value)) {
			throw new Error(`${fieldPath} must be a valid site-relative path: ${value}`);
		}

		return value as `/${string}`;
	}

	return normalizeHttpsUrl(value, fieldPath);
}

function assertImageDimension(value: number, fieldPath: string): void {
	if (!Number.isSafeInteger(value) || value <= 0) {
		throw new Error(`${fieldPath} must be a positive safe integer: ${value}`);
	}
}

function normalizeVisual(
	visual: SkillVisualDefinition,
	fieldPath: string,
): Readonly<SkillVisualDefinition> {
	switch (visual.kind) {
		case 'icon':
			if (!/^[a-z0-9-]+:[a-z0-9-]+$/.test(visual.name)) {
				throw new Error(`${fieldPath}.name must use the icon-set:icon-name format.`);
			}

			return Object.freeze({ ...visual });

		case 'image': {
			assertImageDimension(visual.width, `${fieldPath}.width`);
			assertImageDimension(visual.height, `${fieldPath}.height`);

			const sourceName = visual.sourceName
				? normalizeText(visual.sourceName, `${fieldPath}.sourceName`)
				: undefined;
			const sourceUrl = visual.sourceUrl
				? normalizeHttpsUrl(visual.sourceUrl, `${fieldPath}.sourceUrl`)
				: undefined;

			if ((sourceName === undefined) !== (sourceUrl === undefined)) {
				throw new Error(`${fieldPath} must provide sourceName and sourceUrl together.`);
			}

			return Object.freeze({
				...visual,
				src: normalizeImageSource(visual.src, `${fieldPath}.src`),
				alt: normalizeText(visual.alt, `${fieldPath}.alt`),
				sourceName,
				sourceUrl,
				license: visual.license
					? normalizeText(visual.license, `${fieldPath}.license`)
					: undefined,
			});
		}

		case 'text':
			return Object.freeze({
				...visual,
				text: normalizeText(visual.text, `${fieldPath}.text`),
			});

		default: {
			const exhaustiveVisual: never = visual;
			throw new Error(`${fieldPath} has an unsupported visual kind: ${String(exhaustiveVisual)}`);
		}
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

			if (record.presentation !== 'bubble' && record.presentation !== 'marble') {
				throw new Error(`${recordPath}.presentation is unsupported: ${record.presentation}`);
			}

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
				visual: normalizeVisual(record.visual, `${recordPath}.visual`),
			});
		}),
	);
}
