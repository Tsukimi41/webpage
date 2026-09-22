export type HttpsUrl = `https://${string}`;
export type SimpleIconName = `simple-icons:${string}`;

export interface SocialLinkDefinition {
	readonly id: string;
	readonly label: string;
	readonly href: HttpsUrl;
	readonly icon: SimpleIconName;
}

const socialLinkDefinitions = [
	{
		id: 'github',
		label: 'GitHub',
		href: 'https://github.com/Tsukimi41',
		icon: 'simple-icons:github',
	},
	{
		id: 'zenn',
		label: 'Zenn',
		href: 'https://zenn.dev/masaaaaki',
		icon: 'simple-icons:zenn',
	},
	{
		id: 'x',
		label: 'X',
		href: 'https://x.com/makken41_uec',
		icon: 'simple-icons:x',
	},
] as const satisfies readonly SocialLinkDefinition[];

function validateSocialLinks(
	links: readonly SocialLinkDefinition[],
): readonly Readonly<SocialLinkDefinition>[] {
	const usedIds = new Set<string>();
	const usedUrls = new Set<string>();

	return Object.freeze(
		links.map((link) => {
			const url = new URL(link.href);

			if (url.protocol !== 'https:') {
				throw new Error(`External profile URL must use HTTPS: ${link.href}`);
			}

			if (url.username || url.password) {
				throw new Error(`External profile URL must not contain credentials: ${link.id}`);
			}

			if (link.id.trim() === '' || usedIds.has(link.id)) {
				throw new Error(`External profile ID must be non-empty and unique: ${link.id}`);
			}

			if (link.label.trim() === '') {
				throw new Error(`External profile label must not be empty: ${link.id}`);
			}

			if (!link.icon.startsWith('simple-icons:')) {
				throw new Error(`External profile icon must use Simple Icons: ${link.id}`);
			}

			if (usedUrls.has(url.href)) {
				throw new Error(`External profile URL must be unique: ${link.href}`);
			}

			usedIds.add(link.id);
			usedUrls.add(url.href);

			return Object.freeze({ ...link });
		}),
	);
}

export const socialLinks = validateSocialLinks(socialLinkDefinitions);
