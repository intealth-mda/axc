import { type CourseEntityReference, type CourseRepository, isCourseModality, isCourseStatus } from '@axc/domain';

export type ServiceErrorCode = 'INVALID_QUERY_PARAMETER';
export interface ErrorDetail {
	field: string;
	message: string;
}
export class ServiceError extends Error {
	readonly code: ServiceErrorCode;
	readonly details: ErrorDetail[];
	constructor(code: ServiceErrorCode, message: string, details: ErrorDetail[]) {
		super(message);
		this.code = code;
		this.details = details;
	}
}

export interface SearchCoursesQuery {
	q?: string | undefined;
	modality?: string | undefined;
	status?: string | undefined;
	tag?: string | undefined;
	page?: string | undefined;
	pageSize?: string | undefined;
	sort?: string | undefined;
}

export interface CoursePage {
	items: CourseEntityReference[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

const SORTS = ['title', 'createdAt', 'updatedAt'] as const;
type Sort = (typeof SORTS)[number];
const isSort = (v: string): v is Sort => (SORTS as readonly string[]).includes(v);

const int = (raw: string | undefined, def: number, min: number, max: number): number | undefined => {
	if (raw === undefined) return def;
	if (!/^\d+$/.test(raw)) return undefined;
	const n = Number(raw);
	return n >= min && n <= max ? n : undefined;
};

export function coursesService(repo: CourseRepository) {
	return {
		async search(query: SearchCoursesQuery): Promise<CoursePage> {
			const { q, modality, status, tag, sort = 'title' } = query;
			const details: ErrorDetail[] = [];
			const page = int(query.page, 1, 1, Number.MAX_SAFE_INTEGER);
			const pageSize = int(query.pageSize, 10, 1, 50);
			if (page === undefined) details.push({ field: 'page', message: 'page must be a positive integer.' });
			if (pageSize === undefined) details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
			if (modality !== undefined && !isCourseModality(modality)) details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
			if (status !== undefined && !isCourseStatus(status)) details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
			if (!isSort(sort)) details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
			if (page === undefined || pageSize === undefined || details.length > 0 || !isSort(sort)) {
				throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', details);
			}
			const matches = (await repo.getAll())
				.filter((c) => (q ? c.matchesKeyword(q) : true) && (modality ? c.props.modality === modality : true) && (status ? c.props.status === status : true) && (tag ? c.hasTag(tag) : true))
				.map((c) => c.toReference())
				.sort((a, b) => a[sort].localeCompare(b[sort]));
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
