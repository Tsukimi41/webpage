import {
	ACTIVE_CONTENT_STATES,
	assertContentId,
	selectContentByState,
	type ContentState,
} from '../core/content.ts';
import type { ProjectDefinition } from '../projects/project.ts';
import type { SkillDefinition } from './skill.ts';
import { skills } from './skills.ts';

export interface SkillQuery {
	readonly states?: readonly ContentState[];
	readonly limit?: number;
}

function assertOptionalLimit(limit: number | undefined): void {
	if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 0)) {
		throw new Error(`skill query limit must be a non-negative safe integer: ${limit}`);
	}
}

export function selectSkills<T extends SkillDefinition>(
	records: readonly T[],
	query: SkillQuery = {},
): readonly T[] {
	const { states = ACTIVE_CONTENT_STATES, limit } = query;
	assertOptionalLimit(limit);

	const selectedSkills = selectContentByState(records, states);
	return Object.freeze(limit === undefined ? [...selectedSkills] : selectedSkills.slice(0, limit));
}

export function getSkills(query: SkillQuery = {}): readonly SkillDefinition[] {
	return selectSkills(skills, query);
}

export function findSkillById<T extends SkillDefinition>(
	records: readonly T[],
	id: string,
	query: Pick<SkillQuery, 'states'> = {},
): T | undefined {
	assertContentId(id, 'skill query id');
	const { states = ACTIVE_CONTENT_STATES } = query;
	return selectContentByState(records, states).find((skill) => skill.id === id);
}

export function getSkillById(
	id: string,
	query: Pick<SkillQuery, 'states'> = {},
): SkillDefinition | undefined {
	return findSkillById(skills, id, query);
}

export function getSkillsByIds(
	ids: readonly string[],
	query: Pick<SkillQuery, 'states'> = {},
): readonly SkillDefinition[] {
	const selectedSkills = ids.map((id) => {
		const skill = getSkillById(id, query);

		if (!skill) {
			throw new Error(`No visible skill found for id: ${id}`);
		}

		return skill;
	});

	return Object.freeze(selectedSkills);
}

export function selectProjectsForSkill<T extends ProjectDefinition>(
	projects: readonly T[],
	skillId: string,
	states: readonly ContentState[] = ACTIVE_CONTENT_STATES,
): readonly T[] {
	assertContentId(skillId, 'skill project query id');
	return Object.freeze(
		selectContentByState(projects, states).filter((project) => project.skillIds.includes(skillId)),
	);
}
