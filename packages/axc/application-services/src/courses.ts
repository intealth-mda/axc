import { type CourseEntityReference, type CourseRepository, isCourseModality, isCourseStatus } from '@axc/domain';
import { ServiceError, type ServiceErrorDetail } from './service-error.ts';

export interface SearchCoursesQuery {
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
type CourseSort = (typeof SORTS)[number];

const intIn = (raw: string, min: number, max: number): number | undefined => {
	const n = /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
	return n >= min && n <= max ? n : undefined;
};

export function buildCourseServices(repo: CourseRepository) {
	return {
		async search(query: SearchCoursesQuery): Promise<CourseSearchResult> {
			const { q, modality, status, tag, page: rawPage = '1', pageSize: rawSize = '10', sort = 'title' } = query;
			const details: ServiceErrorDetail[] = [];
			if (modality !== undefined && !isCourseModality(modality)) details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
			if (status !== undefined && !isCourseStatus(status)) details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
			const page = intIn(rawPage, 1, Number.MAX_SAFE_INTEGER);
			if (page === undefined) details.push({ field: 'page', message: 'page must be a positive integer.' });
			const pageSize = intIn(rawSize, 1, 50);
			if (pageSize === undefined) details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
			if (!(SORTS as readonly string[]).includes(sort)) details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
			if (page === undefined || pageSize === undefined || details.length > 0) throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', details);

			const key = sort as CourseSort;
			const matches = (await repo.getAll())
				.filter((c) => (q === undefined || c.matchesKeyword(q)) && (tag === undefined || c.hasTag(tag)))
				.map((c) => c.toReference())
				.filter((c) => (modality === undefined || c.modality === modality) && (status === undefined || c.status === status))
				.sort((a, b) => a[key].localeCompare(b[key]));
			return {
				items: matches.slice((page - 1) * pageSize, page * pageSize),
				page,
				pageSize,
				totalItems: matches.length,
				totalPages: Math.ceil(matches.length / pageSize),
			};
		},
	};
}

export type CourseServices = ReturnType<typeof buildCourseServices>;
