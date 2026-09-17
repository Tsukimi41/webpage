import {
	PREVIEW_CONTENT_STATES,
	selectContentByState,
	type ContentState,
} from '../core/content.ts';
import type { ProjectDefinition } from './project.ts';
import { projects } from './projects.ts';

export interface FeaturedProjectQuery {
	readonly states?: readonly ContentState[];
	readonly limit?: number;
}

function assertOptionalLimit(limit: number | undefined): void {
	if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 0)) {
		throw new Error(`project query limit must be a non-negative safe integer: ${limit}`);
	}
}

export function selectFeaturedProjects<T extends ProjectDefinition>(
	records: readonly T[],
	query: FeaturedProjectQuery = {},
): readonly T[] {
	const { states = PREVIEW_CONTENT_STATES, limit } = query;
	assertOptionalLimit(limit);

	const featuredProjects = selectContentByState(records, states).filter(
		(project) => project.featured,
	);
	const selectedProjects =
		limit === undefined ? featuredProjects : featuredProjects.slice(0, limit);

	return Object.freeze(selectedProjects);
}

export function getFeaturedProjects(query: FeaturedProjectQuery = {}): readonly ProjectDefinition[] {
	return selectFeaturedProjects(projects, query);
}
