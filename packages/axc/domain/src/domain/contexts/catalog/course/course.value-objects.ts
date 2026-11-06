import type { CourseSearchQuery } from './course.entity.ts';
export const modalities: readonly string[] = ['online', 'in-person', 'hybrid'];
export const statuses: readonly string[] = ['draft', 'active', 'retired'];
export const sorts: readonly string[] = ['title', 'createdAt', 'updatedAt'];
export function validateCourseQuery(query: CourseSearchQuery): { field: string; message: string }[] {
	const details: { field: string; message: string }[] = [];
	for (const [field, allowed] of [
		['modality', modalities],
		['status', statuses],
		['sort', sorts],
	] as const) {
		const value = query[field];
		if (value !== undefined && !allowed.includes(value)) details.push({ field, message: `${field} must be one of ${allowed.join(', ')}.` });
	}
	for (const field of ['q', 'tag'] as const) {
		if (query[field] !== undefined && !query[field]?.trim()) details.push({ field, message: `${field} must not be empty.` });
	}
	if (!Number.isSafeInteger(query.page) || query.page < 1) details.push({ field: 'page', message: 'page must be a positive safe integer.' });
	if (!Number.isSafeInteger(query.pageSize) || query.pageSize < 1 || query.pageSize > 50) details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
	return details;
}
