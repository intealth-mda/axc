import type { DataSources } from '@axc/persistence';
export interface CourseSearchQuery {
	q?: string;
	modality?: 'online' | 'in-person' | 'hybrid';
	status?: 'draft' | 'active' | 'retired';
	tag?: string;
	page?: number;
	pageSize?: number;
	sort?: 'title' | 'createdAt' | 'updatedAt';
}
export interface CourseItem {
	id: string;
	title: string;
	summary: string;
	modality: 'online' | 'in-person' | 'hybrid';
	status: 'draft' | 'active' | 'retired';
	tags: readonly string[];
	createdAt: string;
	updatedAt: string;
}
export interface CoursePage {
	items: CourseItem[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}
export class InvalidCourseQueryError extends Error {
	readonly code = 'INVALID_QUERY_PARAMETER';
	readonly details: { field: string; message: string }[];
	constructor(details: { field: string; message: string }[]) {
		super('One or more query parameters are invalid.');
		this.details = details;
	}
}
export function validateCourseQuery(query: CourseSearchQuery): void {
	const details: { field: string; message: string }[] = [];
	for (const [field, value] of Object.entries(query)) {
		let valid: boolean;
		switch (field) {
			case 'q':
			case 'tag':
				valid = typeof value === 'string';
				break;
			case 'modality':
				valid = ['online', 'in-person', 'hybrid'].includes(value);
				break;
			case 'status':
				valid = ['draft', 'active', 'retired'].includes(value);
				break;
			case 'sort':
				valid = ['title', 'createdAt', 'updatedAt'].includes(value);
				break;
			case 'page':
				valid = Number.isSafeInteger(value) && value >= 1;
				break;
			case 'pageSize':
				valid = Number.isSafeInteger(value) && value >= 1 && value <= 50;
				break;
			default:
				valid = false;
		}
		if (!valid) details.push({ field, message: field === 'pageSize' ? 'pageSize must be between 1 and 50.' : `Invalid ${field}.` });
	}
	if (details.length) throw new InvalidCourseQueryError(details);
}
export const search =
	(dataSources: DataSources) =>
	async (query: CourseSearchQuery): Promise<CoursePage> => {
		validateCourseQuery(query);
		const page = query.page ?? 1,
			pageSize = query.pageSize ?? 10;
		const result = await dataSources.readonlyDataSource.Catalog.Course.CourseReadRepo.search({ ...query, page, pageSize, sort: query.sort ?? 'title' });
		return {
			...result,
			items: result.items.map((course) => ({
				id: course.id,
				title: course.title,
				summary: course.summary,
				modality: course.modality,
				status: course.status,
				tags: [...course.tags],
				createdAt: course.createdAt,
				updatedAt: course.updatedAt,
			})),
			page,
			pageSize,
			totalPages: Math.ceil(result.totalItems / pageSize),
		};
	};
