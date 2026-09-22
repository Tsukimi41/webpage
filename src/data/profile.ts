export interface ProfileDefinition {
	readonly handle: string;
	readonly penName: string;
	readonly icon: {
		readonly src: `/${string}`;
		readonly width: number;
		readonly height: number;
	};
	readonly affiliation: {
		readonly university: string;
		readonly faculty: string;
	};
}

const profileDefinition = {
	handle: 'Tsukimi41',
	penName: '薪',
	icon: {
		src: '/favicon.ico',
		width: 256,
		height: 256,
	},
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

function requireLocalPath(value: string, fieldName: string): `/${string}` {
	if (!value.startsWith('/') || value.startsWith('//') || /\s/.test(value)) {
		throw new Error(`Profile field must be a site-relative path: ${fieldName}`);
	}

	return value as `/${string}`;
}

function requireImageDimension(value: number, fieldName: string): number {
	if (!Number.isSafeInteger(value) || value <= 0) {
		throw new Error(`Profile image dimension must be a positive safe integer: ${fieldName}`);
	}

	return value;
}

export function defineProfile(definition: ProfileDefinition): Readonly<ProfileDefinition> {
	return Object.freeze({
		handle: requireText(definition.handle, 'handle'),
		penName: requireText(definition.penName, 'penName'),
		icon: Object.freeze({
			src: requireLocalPath(definition.icon.src, 'icon.src'),
			width: requireImageDimension(definition.icon.width, 'icon.width'),
			height: requireImageDimension(definition.icon.height, 'icon.height'),
		}),
		affiliation: Object.freeze({
			university: requireText(definition.affiliation.university, 'affiliation.university'),
			faculty: requireText(definition.affiliation.faculty, 'affiliation.faculty'),
		}),
	});
}

export const profile = defineProfile(profileDefinition);

export const profileDisplayName = `${profile.handle} / ${profile.penName}`;
