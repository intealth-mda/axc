import { type CourseEntityReference, CourseModality, type CourseRepository, CourseStatus } from '@axc/domain';

const SORTS = ['title', 'createdAt', 'updatedAt'] as const;
const KNOWN = ['q', 'modality', 'status', 'tag', 'page', 'pageSize', 'sort'];

export interface CourseSearchResult {
	items: CourseEntityReference[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

export interface ValidationDetail {
	field: string;
	message: string;
}

export class InvalidQueryError extends Error {
	readonly details: ValidationDetail[];
	constructor(details: ValidationDetail[]) {
		super('One or more query parameters are invalid.');
		this.details = details;
	}
}

const int = (raw: string | undefined, fallback: number, max: number): number | undefined => {
	if (raw === undefined) return fallback;
	if (!/^\d+$/.test(raw)) return undefined;
	const n = Number(raw);
	return n >= 1 && n <= max ? n : undefined;
};

export const courseSearch = (repository: CourseRepository) => ({
	async search(query: Record<string, string>): Promise<CourseSearchResult> {
		const details: ValidationDetail[] = [];
		for (const key of Object.keys(query)) if (!KNOWN.includes(key)) details.push({ field: key, message: `${key} is not a supported query parameter.` });
		const { q, modality, status, tag, sort = 'title' } = query;
		if (modality !== undefined && !CourseModality.isValid(modality)) details.push({ field: 'modality', message: 'modality must be one of: online, in-person, hybrid.' });
		if (status !== undefined && !CourseStatus.isValid(status)) details.push({ field: 'status', message: 'status must be one of: draft, active, retired.' });
		const page = int(query['page'], 1, Number.MAX_SAFE_INTEGER);
		if (page === undefined) details.push({ field: 'page', message: 'page must be a positive integer.' });
		const pageSize = int(query['pageSize'], 10, 50);
		if (pageSize === undefined) details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		if (!(SORTS as readonly string[]).includes(sort)) details.push({ field: 'sort', message: 'sort must be one of: title, createdAt, updatedAt.' });
		if (details.length > 0 || page === undefined || pageSize === undefined) throw new InvalidQueryError(details);

		const needle = q?.toLowerCase();
		const wantTag = tag?.toLowerCase();
		const key = sort as (typeof SORTS)[number];
		const matches = (await repository.getAll())
			.map((c) => c.toReference())
			.filter(
				(c) =>
					(!needle || [c.title, c.summary, ...c.tags].some((s) => s.toLowerCase().includes(needle))) &&
					(!modality || c.modality === modality) &&
					(!status || c.status === status) &&
					(!wantTag || c.tags.some((t) => t.toLowerCase() === wantTag)),
			)
			.sort((a, b) => a[key].localeCompare(b[key]));
		return { items: matches.slice((page - 1) * pageSize, page * pageSize), page, pageSize, totalItems: matches.length, totalPages: Math.ceil(matches.length / pageSize) };
	},
});
