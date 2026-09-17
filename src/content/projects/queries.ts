import {
	PREVIEW_CONTENT_STATES,
	selectContentByState,
	type ContentState,
} from '../core/content.ts';
import type { ProjectDefinition } from './project.ts';
import { projects } from './projects.ts';

export interface ProjectQuery {
	readonly states?: readonly ContentState[];
	readonly limit?: number;
}

function assertOptionalLimit(limit: number | undefined): void {
	if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 0)) {
		throw new Error(`project query limit must be a non-negative safe integer: ${limit}`);
	}
}

function applyLimit<T>(records: readonly T[], limit: number | undefined): readonly T[] {
	assertOptionalLimit(limit);
	return Object.freeze(limit === undefined ? [...records] : records.slice(0, limit));
}

export function selectFeaturedProjects<T extends ProjectDefinition>(
	records: readonly T[],
	query: ProjectQuery = {},
): readonly T[] {
	const { states = PREVIEW_CONTENT_STATES, limit } = query;

	const featuredProjects = selectContentByState(records, states).filter(
		(project) => project.featured,
	);

	return applyLimit(featuredProjects, limit);
}

export function selectProjects<T extends ProjectDefinition>(
	records: readonly T[],
	query: ProjectQuery = {},
): readonly T[] {
	const { states = PREVIEW_CONTENT_STATES, limit } = query;
	const selectedProjects = selectContentByState(records, states);

	return applyLimit(selectedProjects, limit);
}

export function getProjects(query: ProjectQuery = {}): readonly ProjectDefinition[] {
	return selectProjects(projects, query);
}

export function getFeaturedProjects(query: ProjectQuery = {}): readonly ProjectDefinition[] {
	return selectFeaturedProjects(projects, query);
}
