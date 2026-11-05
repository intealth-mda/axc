import { type CourseEntityReference, CourseModality, type CourseRepository, CourseStatus, InvalidCourseValueError } from '@axc/domain';

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

const SORTS = ['title', 'createdAt', 'updatedAt'] as const;
type Sort = (typeof SORTS)[number];

const intParam = (field: string, raw: string, max: number, details: ErrorDetail[]): number => {
	const n = /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
	if (!(n >= 1 && n <= max)) {
		details.push({ field, message: max === Number.MAX_SAFE_INTEGER ? `${field} must be a positive integer.` : `${field} must be between 1 and ${max}.` });
	}
	return n;
};

export function courseService(repo: CourseRepository) {
	return {
		async search(query: CourseSearchQuery): Promise<CourseSearchResult> {
			const { q, modality, status, tag, page: rawPage = '1', pageSize: rawPageSize = '10', sort = 'title' } = query;
			const details: ErrorDetail[] = [];
			for (const [field, value, Vo] of [
				['modality', modality, CourseModality],
				['status', status, CourseStatus],
			] as const) {
				try {
					if (value !== undefined) new Vo(value);
				} catch (e) {
					if (!(e instanceof InvalidCourseValueError)) throw e;
					details.push({ field, message: e.message });
				}
			}
			const page = intParam('page', rawPage, Number.MAX_SAFE_INTEGER, details);
			const pageSize = intParam('pageSize', rawPageSize, 50, details);
			if (!(SORTS as readonly string[]).includes(sort)) {
				details.push({ field: 'sort', message: `sort must be one of ${SORTS.join(', ')}.` });
			}
			if (details.length > 0) {
				throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', details);
			}
			const needle = q?.toLowerCase();
			const tagNeedle = tag?.toLowerCase();
			const key = sort as Sort;
			const matches = (await repo.getAll())
				.map((c) => c.reference)
				.filter(
					(c) =>
						(modality === undefined || c.modality === modality) &&
						(status === undefined || c.status === status) &&
						(tagNeedle === undefined || c.tags.some((t) => t.toLowerCase() === tagNeedle)) &&
						(needle === undefined || [c.title, c.summary, ...c.tags].some((s) => s.toLowerCase().includes(needle))),
				)
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
