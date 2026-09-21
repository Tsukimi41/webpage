export type ArticleSearchKind = 'all' | 'project' | 'blog';

export interface ArticleSearchRecord {
	readonly id: string;
	readonly sourceKind: Exclude<ArticleSearchKind, 'all'>;
	readonly searchText: string;
	readonly topicIds: readonly string[];
}

export interface ArticleSearchCriteria {
	readonly query?: string;
	readonly kind?: ArticleSearchKind;
	readonly topicId?: string;
}

export function normalizeArticleSearchText(value: string): string {
	return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export function parseArticleSearchKind(value: string | null | undefined): ArticleSearchKind {
	return value === 'project' || value === 'blog' ? value : 'all';
}

export function matchesArticleSearch(
	record: ArticleSearchRecord,
	criteria: ArticleSearchCriteria = {},
): boolean {
	const kind = criteria.kind ?? 'all';

	if (kind !== 'all' && record.sourceKind !== kind) {
		return false;
	}

	if (criteria.topicId && !record.topicIds.includes(criteria.topicId)) {
		return false;
	}

	const tokens = normalizeArticleSearchText(criteria.query ?? '').split(' ').filter(Boolean);
	return tokens.every((token) => record.searchText.includes(token));
}

export function filterArticleSearch<T extends ArticleSearchRecord>(
	records: readonly T[],
	criteria: ArticleSearchCriteria = {},
): readonly T[] {
	return Object.freeze(records.filter((record) => matchesArticleSearch(record, criteria)));
}
