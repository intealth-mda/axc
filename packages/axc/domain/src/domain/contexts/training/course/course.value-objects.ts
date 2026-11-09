export const courseModalities = ['online', 'in-person', 'hybrid'] as const;
export const courseStatuses = ['draft', 'active', 'retired'] as const;
export const courseSorts = ['title', 'createdAt', 'updatedAt'] as const;
export type CourseModality = (typeof courseModalities)[number];
export type CourseStatus = (typeof courseStatuses)[number];
export interface CourseSearchQuery {
	q?: string | undefined;
	modality?: string | undefined;
	status?: string | undefined;
	tag?: string | undefined;
	page: number;
	pageSize: number;
	sort: string;
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
		['modality', courseModalities],
		['status', courseStatuses],
		['sort', courseSorts],
	] as const) {
		const value = query[field];
		if (value !== undefined && !allowed.some((item) => item === value)) details.push({ field, message: `${field} must be one of ${allowed.join(', ')}.` });
	}
	for (const field of ['q', 'tag'] as const) if (query[field] !== undefined && !query[field]?.trim()) details.push({ field, message: `${field} must not be empty.` });
	for (const [field, max] of [
		['page', Number.MAX_SAFE_INTEGER],
		['pageSize', 50],
	] as const)
		if (!Number.isSafeInteger(query[field]) || query[field] < 1 || query[field] > max) details.push({ field, message: `${field} must be between 1 and ${max}.` });
	if (details.length) throw new CourseValidationError(details);
}
