import { type CourseEntityReference, type CourseRepository, isModality, isStatus } from '@axc/domain';
import { ServiceError, type ServiceErrorDetail } from './service-error.ts';

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
type SortField = (typeof SORTS)[number];
const isSort = (v: string): v is SortField => (SORTS as readonly string[]).includes(v);

const toInt = (v: string | undefined, def: number, max: number): number | undefined => {
	if (v === undefined) return def;
	if (!/^\d+$/.test(v)) return undefined;
	const n = Number(v);
	return n >= 1 && n <= max ? n : undefined;
};

export const coursesService = (repo: CourseRepository) => ({
	async list(query: ListCoursesQuery): Promise<CoursePage> {
		const { q, modality, status, tag, sort = 'title' } = query;
		const details: ServiceErrorDetail[] = [];
		const page = toInt(query.page, 1, Number.MAX_SAFE_INTEGER);
		const pageSize = toInt(query.pageSize, 10, 50);
		if (modality !== undefined && !isModality(modality)) details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
		if (status !== undefined && !isStatus(status)) details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
		if (page === undefined) details.push({ field: 'page', message: 'page must be a positive integer.' });
		if (pageSize === undefined) details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		if (!isSort(sort)) details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
		if (page === undefined || pageSize === undefined || !isSort(sort) || details.length > 0) {
			throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', details);
		}
		const all = (await repo.getAll())
			.filter((c) => (q === undefined || c.matchesKeyword(q)) && (tag === undefined || c.hasTag(tag)))
			.map((c) => c.reference)
			.filter((c) => (modality === undefined || c.modality === modality) && (status === undefined || c.status === status))
			.sort((a, b) => a[sort].localeCompare(b[sort]));
		return {
			items: all.slice((page - 1) * pageSize, page * pageSize),
			page,
			pageSize,
			totalItems: all.length,
			totalPages: Math.ceil(all.length / pageSize),
		};
	},
});
