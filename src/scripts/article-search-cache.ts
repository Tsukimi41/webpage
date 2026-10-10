import { normalizeArticleSearchText, type ArticleSearchCriteria, type ArticleSearchRecord } from '../content/articles/search.ts';

// A page-local, bounded cache. No persistent storage or stale cross-build data.
export function createArticleSearchCache<T extends ArticleSearchRecord>(records: readonly T[]) {
	const cache = new Map<string, readonly T[]>();
	return (criteria: ArticleSearchCriteria): readonly T[] => {
		const query = normalizeArticleSearchText(criteria.query ?? '');
		const kind = criteria.kind ?? 'all';
		const topic = criteria.topicId ?? '';
		const key = JSON.stringify([query, kind, topic]);
		const cached = cache.get(key);
		if (cached) return cached;
		const tokens = query.split(' ').filter(Boolean);
		const result = Object.freeze(records.filter(record =>
			(kind === 'all' || record.sourceKind === kind) &&
			(!topic || record.topicIds.includes(topic)) &&
			tokens.every(token => record.searchText.includes(token)),
		));
		if (cache.size >= 32) cache.delete(cache.keys().next().value!);
		cache.set(key, result);
		return result;
	};
}
