import { type CourseEntityReference, type CourseRepository, isCourseModality, isCourseStatus } from '@axc/domain';
import { type ErrorDetail, invalid } from './service-error.ts';

export interface CourseSearchQuery {
	q?: string | undefined;
	modality?: string | undefined;
	status?: string | undefined;
	tag?: string | undefined;
	page?: string | undefined;
	pageSize?: string | undefined;
	sort?: string | undefined;
}

export interface CourseSearchResult {
	items: CourseEntityReference[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

const SORTS = ['title', 'createdAt', 'updatedAt'] as const;
const int = (v: string | undefined, fallback: number, min: number, max: number) => (v === undefined ? fallback : /^\d+$/.test(v) && +v >= min && +v <= max ? +v : Number.NaN);

export const courseServices = (repo: CourseRepository) => ({
	async search(query: CourseSearchQuery): Promise<CourseSearchResult> {
		const { q, modality, status, tag, sort = 'title' } = query;
		const page = int(query.page, 1, 1, Number.MAX_SAFE_INTEGER);
		const pageSize = int(query.pageSize, 10, 1, 50);
		const errors: ErrorDetail[] = [];
		if (modality !== undefined && !isCourseModality(modality)) errors.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
		if (status !== undefined && !isCourseStatus(status)) errors.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
		if (Number.isNaN(page)) errors.push({ field: 'page', message: 'page must be a positive integer.' });
		if (Number.isNaN(pageSize)) errors.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		if (!(SORTS as readonly string[]).includes(sort)) errors.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
		if (errors.length) throw invalid(errors);

		const needle = q?.toLowerCase();
		const tagLc = tag?.toLowerCase();
		const key = sort as (typeof SORTS)[number];
		const matches = (await repo.getAll())
			.map((c) => c.props)
			.filter(
				(c) =>
					(!needle || [c.title, c.summary, ...c.tags].some((s) => s.toLowerCase().includes(needle))) &&
					(!modality || c.modality === modality) &&
					(!status || c.status === status) &&
					(!tagLc || c.tags.some((t) => t.toLowerCase() === tagLc)),
			)
			.sort((a, b) => a[key].localeCompare(b[key]));
		return { items: matches.slice((page - 1) * pageSize, page * pageSize), page, pageSize, totalItems: matches.length, totalPages: Math.ceil(matches.length / pageSize) };
	},
});
