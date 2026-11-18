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

export interface CoursePage {
	items: CourseEntityReference[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

const SORTS = ['title', 'createdAt', 'updatedAt'] as const;
const isSort = (v: string): v is (typeof SORTS)[number] => (SORTS as readonly string[]).includes(v);

const int = (field: string, raw: string, min: number, max: number, errors: ErrorDetail[]): number => {
	const n = Number(raw);
	if (!/^\d+$/.test(raw) || n < min || n > max) errors.push({ field, message: `${field} must be between ${min} and ${max}.` });
	return n;
};

export function courseService(repo: CourseRepository) {
	return {
		async search(query: CourseSearchQuery): Promise<CoursePage> {
			const { q, modality, status, tag, page: rawPage = '1', pageSize: rawSize = '10', sort = 'title' } = query;
			const errors: ErrorDetail[] = [];
			if (modality !== undefined && !isCourseModality(modality)) errors.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
			if (status !== undefined && !isCourseStatus(status)) errors.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
			if (!isSort(sort)) errors.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
			const page = int('page', rawPage, 1, Number.MAX_SAFE_INTEGER, errors);
			const pageSize = int('pageSize', rawSize, 1, 50, errors);
			if (errors.length || !isSort(sort)) throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', errors);
			const items = (await repo.getAll())
				.filter((c) => (!q || c.matchesKeyword(q)) && (!modality || c.props.modality === modality) && (!status || c.props.status === status) && (!tag || c.hasTag(tag)))
				.map((c) => c.props)
				.sort((a, b) => a[sort].localeCompare(b[sort]));
			return { items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, totalItems: items.length, totalPages: Math.ceil(items.length / pageSize) };
		},
	};
}
