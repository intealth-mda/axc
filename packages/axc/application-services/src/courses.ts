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

export interface CoursePage {
	items: CourseEntityReference[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

export interface CoursesService {
	search(query: SearchCoursesQuery): Promise<CoursePage>;
}

const SORTS = ['title', 'createdAt', 'updatedAt'] as const;
type SortField = (typeof SORTS)[number];
const isSort = (v: string): v is SortField => (SORTS as readonly string[]).includes(v);
const toInt = (v: string, min: number, max: number): number | undefined => {
	if (!/^\d+$/.test(v)) return undefined;
	const n = Number(v);
	return n >= min && n <= max ? n : undefined;
};

export function createCoursesService(repo: CourseRepository): CoursesService {
	return {
		async search(query) {
			const { q, modality, status, tag, page: rawPage = '1', pageSize: rawSize = '10', sort = 'title' } = query;
			const details: ServiceErrorDetail[] = [];
			if (modality !== undefined && !isCourseModality(modality)) details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
			if (status !== undefined && !isCourseStatus(status)) details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
			const page = toInt(rawPage, 1, Number.MAX_SAFE_INTEGER);
			if (page === undefined) details.push({ field: 'page', message: 'page must be a positive integer.' });
			const pageSize = toInt(rawSize, 1, 50);
			if (pageSize === undefined) details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
			if (!isSort(sort)) details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
			if (details.length > 0 || page === undefined || pageSize === undefined || !isSort(sort)) {
				throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', details);
			}
			const matched = (await repo.getAll())
				.filter((c) => (q ? c.matches(q) : true) && (tag ? c.hasTag(tag) : true) && (modality ? c.props.modality === modality : true) && (status ? c.props.status === status : true))
				.map((c) => c.toReference())
				.sort((a, b) => a[sort].localeCompare(b[sort]) || a.id.localeCompare(b.id));
			const start = (page - 1) * pageSize;
			return { items: matched.slice(start, start + pageSize), page, pageSize, totalItems: matched.length, totalPages: Math.ceil(matched.length / pageSize) };
		},
	};
}
