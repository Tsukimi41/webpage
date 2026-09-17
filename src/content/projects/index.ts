export { assertProjectSkillReferences, defineProjectCollection } from './project.ts';
export type {
	ProjectDefinition,
	ProjectDetailSectionDefinition,
	ProjectHref,
	ProjectLinkDefinition,
} from './project.ts';
export { projects } from './projects.ts';
export {
	getFeaturedProjects,
	getProjectBySlug,
	getProjects,
	findProjectBySlug,
	selectFeaturedProjects,
	selectProjects,
} from './queries.ts';
export type { ProjectQuery } from './queries.ts';
