import {
	ACTIVE_CONTENT_STATES,
	selectContentByState,
	type ContentState,
} from '../core/content.ts';
import type { ProfileDetailDefinition } from './profile-detail.ts';
import { profileDetails } from './profile-details.ts';

export interface ProfileDetailQuery {
	readonly states?: readonly ContentState[];
	readonly limit?: number;
}

function assertOptionalLimit(limit: number | undefined): void {
	if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 0)) {
		throw new Error(`profile detail query limit must be a non-negative safe integer: ${limit}`);
	}
}

export function selectProfileDetails<T extends ProfileDetailDefinition>(
	records: readonly T[],
	query: ProfileDetailQuery = {},
): readonly T[] {
	const { states = ACTIVE_CONTENT_STATES, limit } = query;
	assertOptionalLimit(limit);
	const selectedDetails = selectContentByState(records, states);

	return Object.freeze(limit === undefined ? [...selectedDetails] : selectedDetails.slice(0, limit));
}

export function getProfileDetails(
	query: ProfileDetailQuery = {},
): readonly ProfileDetailDefinition[] {
	return selectProfileDetails(profileDetails, query);
}

export function getProfileDetail(
	query: Pick<ProfileDetailQuery, 'states'> = {},
): ProfileDetailDefinition | undefined {
	return getProfileDetails({ ...query, limit: 1 })[0];
}
