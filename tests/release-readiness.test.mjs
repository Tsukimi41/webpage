import assert from 'node:assert/strict';
import test from 'node:test';

import { defineSiteUrl } from '../src/config/site.ts';
import { profileDetails } from '../src/content/profile/index.ts';
import { projects } from '../src/content/projects/index.ts';
import { skills } from '../src/content/skills/index.ts';
import { socialLinks } from '../src/data/social-links.ts';
import {
	createReleaseReadinessReport,
	isPlaceholderEmail,
	isPlaceholderHostname,
	isPlaceholderUrl,
} from '../src/publication/readiness.ts';
import { scanTextForSecretSignatures } from '../src/publication/security.ts';

function createReadyInput() {
	const publishedSkill = {
		...skills[0],
		id: 'typescript',
		state: 'published',
		label: 'TypeScript',
		summary: '型と検証を使って保守しやすい実装を行います。',
	};
	const publishedProjects = [1, 2, 3].map((order) => ({
		...projects[2],
		id: `project-${order}`,
		state: 'published',
		order,
		slug: `project-${order}`,
		title: `制作プロジェクト ${order}`,
		summary: '設計と検証を行った制作物です。',
		skillIds: ['typescript'],
		links: [],
	}));
	const publishedProfile = {
		...profileDetails[0],
		id: 'profile-details',
		state: 'published',
		summary: 'Web制作と情報設計に取り組んでいます。',
		biography: ['設計理由と検証結果を記録しながら改善します。'],
		contact: {
			label: '公開用メール',
			email: 'contact@portfolio.dev',
			note: '制作に関する連絡先です。',
		},
	};

	return {
		siteUrl: defineSiteUrl('https://portfolio.dev'),
		projects: publishedProjects,
		skills: [publishedSkill],
		blogPosts: [],
		blogTags: [],
		profileDetails: [publishedProfile],
		socialLinks,
		secretFindings: [],
	};
}

test('placeholder detection handles reserved hosts, subdomains, and email domains', () => {
	for (const hostname of ['example.com', 'www.example.net', 'localhost', 'portfolio.example', 'a.invalid', 'a.test']) {
		assert.equal(isPlaceholderHostname(hostname), true, hostname);
	}
	assert.equal(isPlaceholderHostname('github.com'), false);
	assert.equal(isPlaceholderUrl('https://example.org/path'), true);
	assert.equal(isPlaceholderUrl('not a URL'), true);
	assert.equal(isPlaceholderUrl('https://portfolio.dev/'), false);
	assert.equal(isPlaceholderEmail('hello@example.com'), true);
	assert.equal(isPlaceholderEmail('contact@portfolio.dev'), false);
});

test('release readiness accepts the minimum publishable data while retaining manual checks', () => {
	const report = createReleaseReadinessReport(createReadyInput());

	assert.equal(report.ready, true);
	assert.deepEqual(report.metrics, {
		projects: 3,
		skills: 1,
		blogPosts: 0,
		blogTags: 0,
		profileDetails: 1,
		secretFindings: 0,
	});
	assert.equal(report.issues.filter(({ severity }) => severity === 'blocker').length, 0);
	assert.ok(report.issues.some(({ code }) => code === 'no-blog-posts'));
	assert.ok(report.issues.some(({ severity }) => severity === 'manual'));
	assert.ok(Object.isFrozen(report));
	assert.ok(Object.isFrozen(report.metrics));
	assert.ok(Object.isFrozen(report.issues));
});

test('release readiness reports empty source data as explicit blockers', () => {
	const report = createReleaseReadinessReport({
		...createReadyInput(),
		siteUrl: defineSiteUrl(undefined),
		projects: [],
		skills: [],
		profileDetails: [],
	});
	const codes = report.issues.filter(({ severity }) => severity === 'blocker').map(({ code }) => code);

	assert.equal(report.ready, false);
	assert.deepEqual(codes, ['minimum-projects', 'minimum-skills', 'public-site-url', 'single-profile']);
});

test('release readiness rejects mock identities, placeholder contacts, links, and multiple profiles', () => {
	const readyInput = createReadyInput();
	const badProfile = {
		...readyInput.profileDetails[0],
		id: 'mock-profile',
		summary: '架空のプロフィールです。',
		contact: { label: 'Email', email: 'hello@example.com' },
	};
	const badProject = {
		...readyInput.projects[0],
		id: 'mock-project',
		links: [{ id: 'demo', label: 'Demo', href: 'https://example.com/demo' }],
	};
	const report = createReleaseReadinessReport({
		...readyInput,
		projects: [badProject, ...readyInput.projects.slice(1)],
		profileDetails: [badProfile, { ...readyInput.profileDetails[0], id: 'second-profile' }],
	});
	const codes = new Set(report.issues.filter(({ severity }) => severity === 'blocker').map(({ code }) => code));

	assert.equal(report.ready, false);
	for (const code of ['mock-id', 'placeholder-email', 'placeholder-project-link', 'placeholder-text', 'single-profile']) {
		assert.ok(codes.has(code), code);
	}
});

test('secret scanner reports only rule, file, and line without exposing matched values', () => {
	const fakeGithubToken = `ghp_${'A'.repeat(36)}`;
	const fakeAwsKey = `AKIA${'B'.repeat(16)}`;
	const source = `safe\n${fakeGithubToken}\n${fakeAwsKey}\n-----BEGIN PRIVATE KEY-----`;
	const findings = scanTextForSecretSignatures('src/example.ts', source);

	assert.deepEqual(findings.map(({ ruleId, line }) => ({ ruleId, line })), [
		{ ruleId: 'github-token', line: 2 },
		{ ruleId: 'aws-access-key', line: 3 },
		{ ruleId: 'private-key', line: 4 },
	]);
	assert.equal(JSON.stringify(findings).includes(fakeGithubToken), false);
	assert.equal(JSON.stringify(findings).includes(fakeAwsKey), false);
	assert.ok(findings.every((finding) => Object.isFrozen(finding)));
});

test('secret findings become blockers without including the secret value', () => {
	const report = createReleaseReadinessReport({
		...createReadyInput(),
		secretFindings: [{ ruleId: 'private-key', file: 'src/config.ts', line: 7 }],
	});
	const issue = report.issues.find(({ code }) => code === 'secret-signature');

	assert.equal(report.ready, false);
	assert.equal(issue?.scope, 'src/config.ts:7');
	assert.match(issue?.message ?? '', /値は表示しません/);
});
