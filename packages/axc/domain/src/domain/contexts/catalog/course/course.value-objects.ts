const modalities = ['online', 'in-person', 'hybrid'] as const;
const statuses = ['draft', 'active', 'retired'] as const;
const sorts = ['title', 'createdAt', 'updatedAt'] as const;
export type CourseModality = (typeof modalities)[number];
export type CourseStatus = (typeof statuses)[number];
export interface CourseSearchQuery {
	q?: string | undefined;
	modality?: string | undefined;
	status?: string | undefined;
	tag?: string | undefined;
	page: number;
	pageSize: number;
	sort: string;
	invalidFields?: string[];
}
export class CourseValidationError extends Error {
	readonly details: { field: string; message: string }[];
	constructor(details: { field: string; message: string }[]) {
		super('One or more query parameters are invalid.');
		this.name = 'CourseValidationError';
		this.details = details;
	}
}
export function assertCourseSearch(query: CourseSearchQuery): void {
	const details: { field: string; message: string }[] = [];
	for (const [field, allowed] of [
		['modality', modalities],
		['status', statuses],
		['sort', sorts],
	] as const) {
		const value = query[field];
		if (value !== undefined && !allowed.some((option) => option === value)) details.push({ field, message: `${field} must be one of: ${allowed.join(', ')}.` });
	}
	for (const field of ['q', 'tag'] as const) {
		if (query[field] !== undefined && query[field]?.trim() === '') details.push({ field, message: `${field} must not be empty.` });
	}
	if (!Number.isSafeInteger(query.page) || query.page < 1) details.push({ field: 'page', message: 'page must be a positive safe integer.' });
	if (!Number.isSafeInteger(query.pageSize) || query.pageSize < 1 || query.pageSize > 50) details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
	for (const field of query.invalidFields ?? []) details.push({ field, message: 'Query parameter is unknown or repeated.' });
	if (details.length) throw new CourseValidationError(details);
}
