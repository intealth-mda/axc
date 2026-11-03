import { type CourseEntityReference, CourseModalities, type CourseRepository, CourseSortFields, CourseStatuses } from '@axc/domain';
import { type ErrorDetail, ServiceError } from './service-error.ts';

export interface CoursePage {
	items: CourseEntityReference[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

const oneOf = (field: string, allowed: Record<string, string>, value: string | undefined, details: ErrorDetail[]) => {
	const values = Object.values(allowed);
	if (value !== undefined && !values.includes(value)) details.push({ field, message: `${field} must be one of ${values.join(', ')}.` });
};

const intIn = (field: string, value: string | undefined, fallback: number, max: number, details: ErrorDetail[]): number => {
	if (value === undefined) return fallback;
	const n = /^\d+$/.test(value) ? Number(value) : Number.NaN;
	if (!(n >= 1 && n <= max)) details.push({ field, message: max === Number.MAX_SAFE_INTEGER ? `${field} must be a positive integer.` : `${field} must be between 1 and ${max}.` });
	return n;
};

export const searchCourses = async (repo: CourseRepository, query: Record<string, string>): Promise<CoursePage> => {
	const { q, modality, status, tag, sort = 'title', page: rawPage, pageSize: rawPageSize } = query;
	const details: ErrorDetail[] = [];
	oneOf('modality', CourseModalities, modality, details);
	oneOf('status', CourseStatuses, status, details);
	oneOf('sort', CourseSortFields, sort, details);
	const page = intIn('page', rawPage, 1, Number.MAX_SAFE_INTEGER, details);
	const pageSize = intIn('pageSize', rawPageSize, 10, 50, details);
	if (details.length > 0) throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', details);

	const key = sort as keyof CourseEntityReference & ('title' | 'createdAt' | 'updatedAt');
	const matches = (await repo.getAll())
		.filter((c) => (q === undefined || c.matchesKeyword(q)) && (tag === undefined || c.hasTag(tag)) && (modality === undefined || c.props.modality === modality) && (status === undefined || c.props.status === status))
		.map((c) => c.props)
		.sort((a, b) => a[key].localeCompare(b[key]));
	return { items: matches.slice((page - 1) * pageSize, page * pageSize), page, pageSize, totalItems: matches.length, totalPages: Math.ceil(matches.length / pageSize) };
};
