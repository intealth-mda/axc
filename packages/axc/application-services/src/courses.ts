import { type CourseEntityReference, type CourseRepository, isCourseStatus, isModality } from '@axc/domain';
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
type Sort = (typeof SORTS)[number];

const int = (v: string, min: number, max: number) => (/^\d+$/.test(v) && Number(v) >= min && Number(v) <= max ? Number(v) : undefined);

export const courseService = (repo: CourseRepository) => ({
	async search(query: CourseSearchQuery): Promise<CoursePage> {
		const { q, modality, status, tag, page: rawPage = '1', pageSize: rawSize = '10', sort = 'title' } = query;
		const details: ErrorDetail[] = [];
		if (modality !== undefined && !isModality(modality)) details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
		if (status !== undefined && !isCourseStatus(status)) details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
		const page = int(rawPage, 1, Number.MAX_SAFE_INTEGER);
		if (page === undefined) details.push({ field: 'page', message: 'page must be a positive integer.' });
		const pageSize = int(rawSize, 1, 50);
		if (pageSize === undefined) details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		if (!(SORTS as readonly string[]).includes(sort)) details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
		if (details.length || page === undefined || pageSize === undefined) throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', details);

		const key = sort as Sort;
		const matches = (await repo.findAll())
			.filter((c) => (!q || c.matchesKeyword(q)) && (!modality || c.props.modality === modality) && (!status || c.props.status === status) && (!tag || c.hasTag(tag)))
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
