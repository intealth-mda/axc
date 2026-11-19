import { type CourseEntityReference, type CourseRepository, isModality, isStatus } from '@axc/domain';
import { ServiceError, type ServiceErrorDetail } from './service-error.ts';

export interface CourseQuery {
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

const int = (v: string | undefined, def: number, max: number): number => (v === undefined ? def : /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= max ? Number(v) : Number.NaN);

export function buildCourseService(repo: CourseRepository) {
	return {
		async searchCourses(query: CourseQuery): Promise<CoursePage> {
			const { q, modality, status, tag, page: rawPage, pageSize: rawSize, sort = 'title' } = query;
			const details: ServiceErrorDetail[] = [];
			if (modality !== undefined && !isModality(modality)) details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
			if (status !== undefined && !isStatus(status)) details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
			const page = int(rawPage, 1, Number.MAX_SAFE_INTEGER);
			if (Number.isNaN(page)) details.push({ field: 'page', message: 'page must be a positive integer.' });
			const pageSize = int(rawSize, 10, 50);
			if (Number.isNaN(pageSize)) details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
			if (!(SORTS as readonly string[]).includes(sort)) details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
			if (details.length > 0) throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', details);

			const kw = q?.toLowerCase();
			const tg = tag?.toLowerCase();
			const key = sort as Sort;
			const matches = (await repo.getAll())
				.map((c) => c.toReference())
				.filter(
					(c) =>
						(kw === undefined || [c.title, c.summary, ...c.tags].some((s) => s.toLowerCase().includes(kw))) &&
						(modality === undefined || c.modality === modality) &&
						(status === undefined || c.status === status) &&
						(tg === undefined || c.tags.some((t) => t.toLowerCase() === tg)),
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
