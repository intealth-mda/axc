import { type CourseEntityReference, type CourseRepository, isCourseModality, isCourseStatus } from '@axc/domain';
import { type ErrorDetail, ServiceError } from './service-error.ts';

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
type Sort = (typeof SORTS)[number];

const positiveInt = (field: string, raw: string | undefined, fallback: number, max: number, details: ErrorDetail[]): number => {
	if (raw === undefined) return fallback;
	const n = /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
	if (!(n >= 1 && n <= max)) {
		details.push({ field, message: max === Number.MAX_SAFE_INTEGER ? `${field} must be a positive integer.` : `${field} must be between 1 and ${max}.` });
	}
	return n;
};

export const buildCourseService = (courses: CourseRepository) => ({
	async search(query: CourseSearchQuery): Promise<CourseSearchResult> {
		const { q, modality, status, tag, sort = 'title' } = query;
		const details: ErrorDetail[] = [];
		if (modality !== undefined && !isCourseModality(modality)) details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
		if (status !== undefined && !isCourseStatus(status)) details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
		if (!(SORTS as readonly string[]).includes(sort)) details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
		const page = positiveInt('page', query.page, 1, Number.MAX_SAFE_INTEGER, details);
		const pageSize = positiveInt('pageSize', query.pageSize, 10, 50, details);
		if (details.length > 0) throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', details);

		const key = sort as Sort;
		const matches = (await courses.getAll())
			.filter((c) => (q ? c.matchesKeyword(q) : true) && (tag ? c.hasTag(tag) : true) && (modality ? c.props.modality === modality : true) && (status ? c.props.status === status : true))
			.map((c) => c.props)
			.sort((a, b) => a[key].localeCompare(b[key]));
		return {
			items: matches.slice((page - 1) * pageSize, page * pageSize),
			page,
			pageSize,
			totalItems: matches.length,
			totalPages: Math.ceil(matches.length / pageSize),
		};
	},
});
