export { defineSkillCollection, SKILL_CATEGORIES, SKILL_SCALES } from './skill.ts';
export type {
	SkillCategory,
	SkillDefinition,
	SkillIconVisualDefinition,
	SkillIconName,
	SkillImageVisualDefinition,
	SkillImageSource,
	SkillPresentation,
	SkillScale,
	SkillTextVisualDefinition,
	SkillVisualDefinition,
} from './skill.ts';
export { skills } from './skills.ts';
export {
	findSkillById,
	getSkillById,
	getSkillsByIds,
	getSkills,
	selectProjectsForSkill,
	selectSkills,
} from './queries.ts';
export type { SkillQuery } from './queries.ts';
