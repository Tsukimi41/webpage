import {
	assertContentId,
	assertNonEmptyText,
	defineContentCollection,
	type ContentRecord,
} from '../core/content.ts';

export const SKILL_CATEGORIES = [
	'language',
	'framework',
	'library',
	'runtime',
	'markup',
	'styling',
	'operating-system',
	'platform',
	'infrastructure',
	'hardware',
	'design',
	'tool',
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export type SkillPresentation = 'bubble' | 'marble';
export const SKILL_SCALES = ['small', 'medium', 'large'] as const;
export type SkillScale = (typeof SKILL_SCALES)[number];
export type SkillImageSource = `/${string}` | `https://${string}`;
export type SkillIconName = `${string}:${string}`;

export interface SkillIconVisualDefinition {
	readonly kind: 'icon';
	readonly name: SkillIconName;
	readonly fallbackText?: string;
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
	readonly fallbackText?: string;
}

export interface SkillTextVisualDefinition {
	readonly kind: 'text';
	readonly text: string;
	readonly fallbackText?: string;
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
	readonly scale: SkillScale;
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
	if (!Number.isSafeInteger(value) || value <= 0 || value > 8_192) {
		throw new Error(`${fieldPath} must be a positive safe integer up to 8192: ${value}`);
	}
}

function normalizeShortText(value: string, fieldPath: string): string {
	const normalized = normalizeText(value, fieldPath);

	if (Array.from(normalized).length > 24) {
		throw new Error(`${fieldPath} must contain no more than 24 characters.`);
	}

	return normalized;
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

			return Object.freeze({
				...visual,
				...(visual.fallbackText
					? {
						fallbackText: normalizeShortText(
							visual.fallbackText,
							`${fieldPath}.fallbackText`,
						),
					}
					: {}),
			});

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

			const src = normalizeImageSource(visual.src, `${fieldPath}.src`);
			if (src.startsWith('https://') && sourceName === undefined) {
				throw new Error(`${fieldPath} must attribute remote images with sourceName and sourceUrl.`);
			}

			return Object.freeze({
				...visual,
				src,
				alt: normalizeText(visual.alt, `${fieldPath}.alt`),
				sourceName,
				sourceUrl,
				license: visual.license
					? normalizeText(visual.license, `${fieldPath}.license`)
					: undefined,
				...(visual.fallbackText
					? {
						fallbackText: normalizeShortText(
							visual.fallbackText,
							`${fieldPath}.fallbackText`,
						),
					}
					: {}),
			});
		}

		case 'text': {
			const text = normalizeShortText(visual.text, `${fieldPath}.text`);
			return Object.freeze({
				...visual,
				text,
				fallbackText: visual.fallbackText
					? normalizeShortText(visual.fallbackText, `${fieldPath}.fallbackText`)
					: text,
			});
		}

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

			if (!SKILL_SCALES.includes(record.scale)) {
				throw new Error(`${recordPath}.scale is unsupported: ${record.scale}`);
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
