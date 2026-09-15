export interface ProfileDefinition {
	readonly handle: string;
	readonly penName: string;
	readonly affiliation: {
		readonly university: string;
		readonly faculty: string;
	};
}

const profileDefinition = {
	handle: 'Tsukimi41',
	penName: '薪',
	affiliation: {
		university: '電気通信大学',
		faculty: '情報理工学域 Ⅱ類',
	},
} as const satisfies ProfileDefinition;

function requireText(value: string, fieldName: string): string {
	const normalizedValue = value.trim();

	if (normalizedValue === '') {
		throw new Error(`Profile field must not be empty: ${fieldName}`);
	}

	return normalizedValue;
}

export const profile: Readonly<ProfileDefinition> = Object.freeze({
	handle: requireText(profileDefinition.handle, 'handle'),
	penName: requireText(profileDefinition.penName, 'penName'),
	affiliation: Object.freeze({
		university: requireText(profileDefinition.affiliation.university, 'affiliation.university'),
		faculty: requireText(profileDefinition.affiliation.faculty, 'affiliation.faculty'),
	}),
});

export const profileDisplayName = `${profile.handle} / ${profile.penName}`;
