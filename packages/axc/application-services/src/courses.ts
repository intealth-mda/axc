import { type CourseEntityReference, isCourseStatus, isModality } from '@axc/domain';
import { InMemoryCourseRepository } from '@axc/persistence';

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
		this.name = 'ServiceError';
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
export interface CoursesService {
	search(query: CourseSearchQuery): Promise<CourseSearchResult>;
}

const SORTS = ['title', 'createdAt', 'updatedAt'] as const;
type Sort = (typeof SORTS)[number];

export function buildCoursesService(repo: InMemoryCourseRepository = new InMemoryCourseRepository()): CoursesService {
	return {
		async search(query) {
			const { q, modality, status, tag, page = '1', pageSize = '10', sort = 'title' } = query;
			const details: ErrorDetail[] = [];
			const int = (field: string, v: string, max: number) => {
				const n = /^\d+$/.test(v) ? Number(v) : Number.NaN;
				if (!(n >= 1 && n <= max)) details.push({ field, message: max === Number.MAX_SAFE_INTEGER ? `${field} must be a positive integer.` : `${field} must be between 1 and ${max}.` });
				return n;
			};
			const p = int('page', page, Number.MAX_SAFE_INTEGER);
			const size = int('pageSize', pageSize, 50);
			if (modality !== undefined && !isModality(modality)) details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
			if (status !== undefined && !isCourseStatus(status)) details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
			if (!(SORTS as readonly string[]).includes(sort)) details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
			if (details.length > 0) throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', details);

			const kw = q?.toLowerCase();
			const t = tag?.toLowerCase();
			const key = sort as Sort;
			const matched = (await repo.getAll())
				.filter(
					(c) =>
						(!kw || [c.title, c.summary, ...c.tags].some((s) => s.toLowerCase().includes(kw))) && (!modality || c.modality === modality) && (!status || c.status === status) && (!t || c.tags.some((x) => x.toLowerCase() === t)),
				)
				.sort((a, b) => a[key].localeCompare(b[key]) || a.id.localeCompare(b.id));
			const items = matched.slice((p - 1) * size, p * size).map(({ id, title, summary, modality, status, tags, createdAt, updatedAt }) => ({ id, title, summary, modality, status, tags, createdAt, updatedAt }));
			return { items, page: p, pageSize: size, totalItems: matched.length, totalPages: Math.ceil(matched.length / size) };
		},
	};
}
