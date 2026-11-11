import { type CourseEntityReference, type CourseRepository, isCourseModality, isCourseStatus } from '@axc/domain';

export type ServiceErrorCode = 'INVALID_QUERY_PARAMETER';
interface ServiceErrorDetail {
	field: string;
	message: string;
}

export class ServiceError extends Error {
	readonly code: ServiceErrorCode;
	readonly details: ServiceErrorDetail[];
	constructor(code: ServiceErrorCode, message: string, details: ServiceErrorDetail[]) {
		super(message);
		this.code = code;
		this.details = details;
	}
}

export interface ListCoursesQuery {
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
type CourseSort = (typeof SORTS)[number];
const isSort = (v: string): v is CourseSort => (SORTS as readonly string[]).includes(v);

export function buildCoursesService(repository: CourseRepository) {
	return {
		async list(query: ListCoursesQuery): Promise<CoursePage> {
			const { q, modality, status, tag, page = '1', pageSize = '10', sort = 'title' } = query;
			const details: ServiceErrorDetail[] = [];
			const int = (field: string, raw: string, max: number) => {
				const n = /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
				if (!(n >= 1 && n <= max)) details.push({ field, message: max === Number.MAX_SAFE_INTEGER ? `${field} must be a positive integer.` : `${field} must be between 1 and ${max}.` });
				return n;
			};
			const pageNo = int('page', page, Number.MAX_SAFE_INTEGER);
			const size = int('pageSize', pageSize, 50);
			if (modality !== undefined && !isCourseModality(modality)) details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
			if (status !== undefined && !isCourseStatus(status)) details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
			if (!isSort(sort)) details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
			if (details.length > 0 || !isSort(sort)) throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', details);

			const matched = (await repository.getAll())
				.filter((c) => (!q || c.matchesKeyword(q)) && (!modality || c.props.modality === modality) && (!status || c.props.status === status) && (!tag || c.hasTag(tag)))
				.map((c) => ({ ...c.props, tags: [...c.props.tags] }))
				.sort((a, b) => a[sort].localeCompare(b[sort]) || a.id.localeCompare(b.id));
			return {
				items: matched.slice((pageNo - 1) * size, pageNo * size),
				page: pageNo,
				pageSize: size,
				totalItems: matched.length,
				totalPages: Math.ceil(matched.length / size),
			};
		},
	};
}
