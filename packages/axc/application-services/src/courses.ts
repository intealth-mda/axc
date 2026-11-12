import { type CourseEntityReference, type CourseRepository, isCourseStatus, isModality } from '@axc/domain';
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
type Sort = (typeof SORTS)[number];

const int = (v: string | undefined, def: number, min: number, max: number, field: string, errs: ServiceErrorDetail[]): number => {
	if (v === undefined) return def;
	const n = /^\d+$/.test(v) ? Number(v) : Number.NaN;
	if (Number.isNaN(n) || n < min || n > max) errs.push({ field, message: max === Number.MAX_SAFE_INTEGER ? `${field} must be a positive integer.` : `${field} must be between ${min} and ${max}.` });
	return n;
};

export const searchCourses = async (repo: CourseRepository, query: SearchCoursesQuery): Promise<CourseSearchResult> => {
	const { q, modality, status, tag, sort = 'title' } = query;
	const errs: ServiceErrorDetail[] = [];
	if (modality !== undefined && !isModality(modality)) errs.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
	if (status !== undefined && !isCourseStatus(status)) errs.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
	if (!(SORTS as readonly string[]).includes(sort)) errs.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
	const page = int(query.page, 1, 1, Number.MAX_SAFE_INTEGER, 'page', errs);
	const pageSize = int(query.pageSize, 10, 1, 50, 'pageSize', errs);
	if (errs.length) throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', errs);

	const kw = q?.toLowerCase();
	const tg = tag?.toLowerCase();
	const key = sort as Sort;
	const matches = (await repo.getAll())
		.map((c) => c.reference)
		.filter(
			(c) => (!kw || [c.title, c.summary, ...c.tags].some((s) => s.toLowerCase().includes(kw))) && (!modality || c.modality === modality) && (!status || c.status === status) && (!tg || c.tags.some((t) => t.toLowerCase() === tg)),
		)
		.sort((a, b) => a[key].localeCompare(b[key]));
	return {
		items: matches.slice((page - 1) * pageSize, page * pageSize),
		page,
		pageSize,
		totalItems: matches.length,
		totalPages: Math.ceil(matches.length / pageSize),
	};
};
