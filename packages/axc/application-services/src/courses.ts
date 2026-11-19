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
const isSort = (v: string): v is Sort => (SORTS as readonly string[]).includes(v);

const int = (v: string | undefined, def: number, min: number, max: number): number | undefined => {
	if (v === undefined) return def;
	if (!/^\d+$/.test(v)) return undefined;
	const n = Number(v);
	return n >= min && n <= max ? n : undefined;
};

export const searchCourses = async (repo: CourseRepository, query: CourseSearchQuery): Promise<CourseSearchResult> => {
	const { q, modality, status, tag, page: rawPage, pageSize: rawPageSize, sort = 'title' } = query;
	const details: ErrorDetail[] = [];
	if (modality !== undefined && !isCourseModality(modality)) details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
	if (status !== undefined && !isCourseStatus(status)) details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
	const page = int(rawPage, 1, 1, Number.MAX_SAFE_INTEGER);
	if (page === undefined) details.push({ field: 'page', message: 'page must be a positive integer.' });
	const pageSize = int(rawPageSize, 10, 1, 50);
	if (pageSize === undefined) details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
	if (!isSort(sort)) details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
	if (details.length > 0 || page === undefined || pageSize === undefined || !isSort(sort)) {
		throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', details);
	}
	const needle = q?.toLowerCase();
	const wantTag = tag?.toLowerCase();
	const matches = (await repo.getAll())
		.map((c) => c.toReference())
		.filter(
			(c) =>
				(modality === undefined || c.modality === modality) &&
				(status === undefined || c.status === status) &&
				(wantTag === undefined || c.tags.some((t) => t.toLowerCase() === wantTag)) &&
				(needle === undefined || [c.title, c.summary, ...c.tags].some((s) => s.toLowerCase().includes(needle))),
		)
		.sort((a, b) => a[sort].localeCompare(b[sort]) || a.id.localeCompare(b.id));
	return {
		items: matches.slice((page - 1) * pageSize, page * pageSize),
		page,
		pageSize,
		totalItems: matches.length,
		totalPages: Math.ceil(matches.length / pageSize),
	};
};
