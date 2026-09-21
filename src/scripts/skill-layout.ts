import type { SkillPresentation } from '../content/skills/skill.ts';

export interface SkillObjectPlacement {
	readonly x: number;
	readonly y: number;
	readonly size: number;
	readonly delay: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
	return Math.min(Math.max(value, minimum), maximum);
}

function assertPlacementInput(
	index: number,
	count: number,
	presentation: SkillPresentation,
): void {
	if (!Number.isSafeInteger(count) || count <= 0) {
		throw new Error(`skill placement count must be a positive safe integer: ${count}`);
	}

	if (!Number.isSafeInteger(index) || index < 0 || index >= count) {
		throw new Error(`skill placement index must be within the collection: ${index}/${count}`);
	}

	if (presentation !== 'bubble' && presentation !== 'marble') {
		throw new Error(`skill placement presentation is unsupported: ${presentation}`);
	}
}

export function createSkillObjectPlacement(
	index: number,
	count: number,
	presentation: SkillPresentation,
): Readonly<SkillObjectPlacement> {
	assertPlacementInput(index, count, presentation);
	const columns = Math.max(1, Math.ceil(Math.sqrt(count * 1.45)));
	const rows = Math.max(1, Math.ceil(count / columns));
	const column = index % columns;
	const row = Math.floor(index / columns);
	const horizontalJitter = ((index * 37) % 11) - 5;
	const verticalJitter = ((index * 23) % 9) - 4;
	const baseSize = clamp(6.6 - Math.max(count - 5, 0) * 0.22, 3.15, 6.6);
	const materialScale = presentation === 'marble' ? 1.42 : 1;
	const sizeVariation = 0.9 + ((index * 0.618_033_988_75) % 1) * 0.15;
	const size = baseSize * sizeVariation * materialScale;
	const x = 8 + ((column + 0.5) / columns) * 84 + horizontalJitter * 0.35;
	const rowRatio = (row + 0.5) / rows;
	const y = presentation === 'bubble'
		? 9 + rowRatio * 66 + verticalJitter * 0.4
		: 4 + rowRatio * 46 + verticalJitter * 0.32;

	return Object.freeze({
		x: clamp(x, 6, 94),
		y: clamp(y, 4, presentation === 'bubble' ? 82 : 56),
		size,
		delay: -(index % 9) * 0.55,
	});
}
