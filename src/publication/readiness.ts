import type { BlogPostDefinition, BlogTagDefinition } from '../content/blog/index.ts';
import type { ProfileDetailDefinition } from '../content/profile/index.ts';
import type { ProjectDefinition } from '../content/projects/index.ts';
import type { SkillDefinition } from '../content/skills/index.ts';
import type { SocialLinkDefinition } from '../data/social-links.ts';
import type { SiteUrlConfig } from '../config/site.ts';
import type { SecretFinding } from './security.ts';

export const MINIMUM_RELEASE_PROJECTS = 3;
export const MINIMUM_RELEASE_SKILLS = 1;

export type ReleaseIssueSeverity = 'blocker' | 'warning' | 'manual';

export interface ReleaseIssue {
	readonly code: string;
	readonly severity: ReleaseIssueSeverity;
	readonly scope: string;
	readonly message: string;
}

export interface ReleaseReadinessMetrics {
	readonly projects: number;
	readonly skills: number;
	readonly blogPosts: number;
	readonly blogTags: number;
	readonly profileDetails: number;
	readonly secretFindings: number;
}

export interface ReleaseReadinessReport {
	readonly ready: boolean;
	readonly metrics: Readonly<ReleaseReadinessMetrics>;
	readonly issues: readonly Readonly<ReleaseIssue>[];
}

export interface ReleaseReadinessInput {
	readonly siteUrl: Readonly<SiteUrlConfig>;
	readonly projects: readonly Readonly<ProjectDefinition>[];
	readonly skills: readonly Readonly<SkillDefinition>[];
	readonly blogPosts: readonly Readonly<BlogPostDefinition>[];
	readonly blogTags: readonly Readonly<BlogTagDefinition>[];
	readonly profileDetails: readonly Readonly<ProfileDetailDefinition>[];
	readonly socialLinks: readonly Readonly<SocialLinkDefinition>[];
	readonly secretFindings?: readonly Readonly<SecretFinding>[];
}

const PLACEHOLDER_HOSTS = new Set(['example.com', 'example.net', 'example.org']);
const PLACEHOLDER_TEXT_PATTERN = /(?:^|\b)(?:mock|placeholder)(?:\b|$)|モック|架空/i;
const SEVERITY_ORDER: Readonly<Record<ReleaseIssueSeverity, number>> = Object.freeze({
	blocker: 0,
	warning: 1,
	manual: 2,
});

export function isPlaceholderHostname(hostname: string): boolean {
	const normalizedHostname = hostname.toLowerCase().replace(/\.$/, '');
	return (
		[...PLACEHOLDER_HOSTS].some(
			(placeholderHost) =>
				normalizedHostname === placeholderHost ||
				normalizedHostname.endsWith(`.${placeholderHost}`),
		) ||
		normalizedHostname === 'localhost' ||
		normalizedHostname.endsWith('.example') ||
		normalizedHostname.endsWith('.invalid') ||
		normalizedHostname.endsWith('.test')
	);
}

export function isPlaceholderUrl(value: string): boolean {
	try {
		return isPlaceholderHostname(new URL(value).hostname);
	} catch {
		return true;
	}
}

export function isPlaceholderEmail(value: string): boolean {
	const separatorIndex = value.lastIndexOf('@');
	return separatorIndex < 1 || isPlaceholderHostname(value.slice(separatorIndex + 1));
}

function createIssue(
	severity: ReleaseIssueSeverity,
	code: string,
	scope: string,
	message: string,
): Readonly<ReleaseIssue> {
	return Object.freeze({ severity, code, scope, message });
}

function published<T extends { readonly state: string }>(records: readonly T[]): readonly T[] {
	return records.filter((record) => record.state === 'published');
}

function inspectPublishedIdentity(
	issues: Readonly<ReleaseIssue>[],
	record: { readonly id: string; readonly state: string },
	label: string,
	texts: readonly string[],
): void {
	if (record.id.startsWith('mock-')) {
		issues.push(createIssue('blocker', 'mock-id', `${label}.${record.id}`, '公開IDにmock接頭辞が残っています。'));
	}

	if (texts.some((text) => PLACEHOLDER_TEXT_PATTERN.test(text))) {
		issues.push(createIssue('blocker', 'placeholder-text', `${label}.${record.id}`, '公開文言にモックまたは架空を示す表記が残っています。'));
	}
}

export function createReleaseReadinessReport(
	input: ReleaseReadinessInput,
): Readonly<ReleaseReadinessReport> {
	const issues: ReleaseIssue[] = [];
	const publicProjects = published(input.projects);
	const publicSkills = published(input.skills);
	const publicBlogPosts = published(input.blogPosts);
	const publicBlogTags = published(input.blogTags);
	const publicProfiles = published(input.profileDetails);
	const secretFindings = input.secretFindings ?? [];

	if (!input.siteUrl.isPublic || isPlaceholderUrl(input.siteUrl.href)) {
		issues.push(createIssue('blocker', 'public-site-url', 'site', '実在するHTTPS公開URLが設定されていません。'));
	}

	if (publicProjects.length < MINIMUM_RELEASE_PROJECTS) {
		issues.push(createIssue(
			'blocker',
			'minimum-projects',
			'projects',
			`公開プロジェクトは${MINIMUM_RELEASE_PROJECTS}件以上必要です。現在は${publicProjects.length}件です。`,
		));
	}

	if (publicSkills.length < MINIMUM_RELEASE_SKILLS) {
		issues.push(createIssue('blocker', 'minimum-skills', 'skills', '公開スキルが1件以上必要です。'));
	}

	if (publicProfiles.length !== 1) {
		issues.push(createIssue('blocker', 'single-profile', 'profile', `公開プロフィール詳細は1件必要です。現在は${publicProfiles.length}件です。`));
	}

	for (const project of publicProjects) {
		inspectPublishedIdentity(issues, project, 'projects', [project.title, project.summary]);

		for (const link of project.links) {
			if (link.href.startsWith('https://') && isPlaceholderUrl(link.href)) {
				issues.push(createIssue('blocker', 'placeholder-project-link', `projects.${project.id}.${link.id}`, '公開プロジェクトにプレースホルダーURLが残っています。'));
			}
		}
	}

	for (const skill of publicSkills) {
		inspectPublishedIdentity(issues, skill, 'skills', [skill.label, skill.summary]);
	}

	for (const post of publicBlogPosts) {
		inspectPublishedIdentity(issues, post, 'blogPosts', [post.title, post.description]);
	}

	for (const tag of publicBlogTags) {
		inspectPublishedIdentity(issues, tag, 'blogTags', [tag.label, tag.description]);
	}

	for (const profile of publicProfiles) {
		inspectPublishedIdentity(issues, profile, 'profileDetails', [
			profile.summary,
			...profile.biography,
			...profile.interests.flatMap((item) => [item.title, item.description]),
			...profile.principles.flatMap((item) => [item.title, item.description]),
			profile.contact?.note ?? '',
		]);

		if (!profile.contact) {
			issues.push(createIssue('blocker', 'public-contact', `profileDetails.${profile.id}`, '公開用メールアドレスが設定されていません。'));
		} else if (isPlaceholderEmail(profile.contact.email)) {
			issues.push(createIssue('blocker', 'placeholder-email', `profileDetails.${profile.id}`, '公開用メールアドレスがプレースホルダーです。'));
		}
	}

	for (const socialLink of input.socialLinks) {
		if (isPlaceholderUrl(socialLink.href)) {
			issues.push(createIssue('blocker', 'placeholder-social-link', `socialLinks.${socialLink.id}`, '外部プロフィールURLがプレースホルダーです。'));
		}
	}

	for (const finding of secretFindings) {
		issues.push(createIssue('blocker', 'secret-signature', `${finding.file}:${finding.line}`, `高確度の秘密情報パターンを検出しました（${finding.ruleId}）。値は表示しません。`));
	}

	if (publicBlogPosts.length === 0) {
		issues.push(createIssue('warning', 'no-blog-posts', 'blogPosts', '公開ブログ記事は0件です。初期記事数を確認してください。'));
	}

	issues.push(createIssue('manual', 'privacy-review', 'site', '本名、学籍番号、私用連絡先、位置情報が含まれないことを人が確認してください。'));
	issues.push(createIssue('manual', 'rights-review', 'site', '画像、アイコン、文章、外部リンクの権利と公開許可を人が確認してください。'));
	issues.push(createIssue('manual', 'device-review', 'site', '対象ブラウザ、実機、200%拡大、キーボード、3テーマを人が確認してください。'));
	issues.push(createIssue('manual', 'hosting-headers', 'hosting', '配信先決定後にCSP、frame-ancestors、nosniff、Referrer-PolicyなどのHTTPヘッダーを設定してください。'));

	const sortedIssues = issues.sort(
		(left, right) =>
			SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity] ||
			left.code.localeCompare(right.code) ||
			left.scope.localeCompare(right.scope),
	);
	const metrics = Object.freeze({
		projects: publicProjects.length,
		skills: publicSkills.length,
		blogPosts: publicBlogPosts.length,
		blogTags: publicBlogTags.length,
		profileDetails: publicProfiles.length,
		secretFindings: secretFindings.length,
	});

	return Object.freeze({
		ready: !sortedIssues.some((issue) => issue.severity === 'blocker'),
		metrics,
		issues: Object.freeze(sortedIssues),
	});
}
