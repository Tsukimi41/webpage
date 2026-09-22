export interface SecretFinding {
	readonly ruleId: string;
	readonly file: string;
	readonly line: number;
}

interface SecretRule {
	readonly id: string;
	readonly pattern: RegExp;
}

const SECRET_RULES: readonly SecretRule[] = Object.freeze([
	Object.freeze({
		id: 'private-key',
		pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
	}),
	Object.freeze({ id: 'github-token', pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g }),
	Object.freeze({ id: 'github-fine-grained-token', pattern: /\bgithub_pat_[A-Za-z0-9_]{70,}\b/g }),
	Object.freeze({ id: 'aws-access-key', pattern: /\bAKIA[0-9A-Z]{16}\b/g }),
	Object.freeze({ id: 'google-api-key', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g }),
	Object.freeze({ id: 'slack-token', pattern: /\bxox[baprs]-[0-9A-Za-z-]{20,}\b/g }),
	Object.freeze({ id: 'openai-api-key', pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g }),
]);

export function scanTextForSecretSignatures(
	file: string,
	source: string,
): readonly Readonly<SecretFinding>[] {
	const findings: SecretFinding[] = [];

	for (const rule of SECRET_RULES) {
		const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);

		for (const match of source.matchAll(pattern)) {
			const matchIndex = match.index ?? 0;
			const line = source.slice(0, matchIndex).split(/\r?\n/).length;
			findings.push(Object.freeze({ ruleId: rule.id, file, line }));
		}
	}

	return Object.freeze(
		findings.sort(
			(left, right) =>
				left.file.localeCompare(right.file) ||
				left.line - right.line ||
				left.ruleId.localeCompare(right.ruleId),
		),
	);
}
