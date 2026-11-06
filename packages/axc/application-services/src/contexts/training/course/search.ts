import { type CourseEntityReference, RuleError } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { object } from '../../../validation.ts';
export interface CourseSearchQuery {
	q?: string;
	modality?: string;
	status?: string;
	tag?: string;
	page?: string;
	pageSize?: string;
	sort?: string;
}
export interface CoursePage {
	items: CourseEntityReference[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}
export const search =
	(dataSources: DataSources) =>
	async (query: CourseSearchQuery = {}): Promise<CoursePage> => {
		const input = object(query, ['q', 'modality', 'status', 'tag', 'page', 'pageSize', 'sort'], 'INVALID_QUERY_PARAMETER');
		const fail = (field: string, message: string): never => {
			throw new RuleError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', [{ field, message }]);
		};
		for (const [field, value] of Object.entries(input)) if (typeof value !== 'string' || !value.trim()) fail(field, `${field} must be a non-empty string.`);
		const enumValue = (field: string, allowed: readonly string[], fallback?: string) => {
			const value = input[field] ?? fallback;
			if (value !== undefined && (typeof value !== 'string' || !allowed.includes(value))) fail(field, `Invalid ${field}.`);
			return value;
		};
		const modality = enumValue('modality', ['online', 'in-person', 'hybrid']);
		const status = enumValue('status', ['draft', 'active', 'retired']);
		const sort = enumValue('sort', ['title', 'createdAt', 'updatedAt'], 'title') as 'title' | 'createdAt' | 'updatedAt';
		const integer = (field: string, fallback: number, maximum: number) => {
			const raw = input[field];
			if (raw === undefined) return fallback;
			if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) fail(field, `${field} must be a positive integer.`);
			const value = Number(raw);
			if (!Number.isSafeInteger(value) || value > maximum) fail(field, `${field} must be between 1 and ${maximum}.`);
			return value;
		};
		const page = integer('page', 1, Number.MAX_SAFE_INTEGER);
		const pageSize = integer('pageSize', 10, 50);
		const q = query.q?.trim().toLowerCase();
		const tag = query.tag?.trim().toLowerCase();
		const courses = await dataSources.readonlyDataSource.Training.Course.CourseReadRepo.list();
		const items = courses.filter(
			(course) =>
				(!q || [course.title, course.summary, ...course.tags].some((value) => value.toLowerCase().includes(q))) &&
				(!modality || course.modality === modality) &&
				(!status || course.status === status) &&
				(!tag || course.tags.some((value) => value.toLowerCase() === tag)),
		);
		items.sort((a, b) => a[sort].localeCompare(b[sort]) || a.id.localeCompare(b.id));
		const start = (page - 1) * pageSize;
		return { items: items.slice(start, start + pageSize), page, pageSize, totalItems: items.length, totalPages: Math.ceil(items.length / pageSize) };
	};
