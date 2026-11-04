import { type Course, type CourseRepository, type CourseSort, courseModalities, courseSorts, courseStatuses } from '@axc/domain';
import { ApplicationError, type ErrorDetail, isOneOf } from './errors.ts';

export interface CoursePage {
	items: Course[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

const QUERY_MESSAGE = 'One or more query parameters are invalid.';

export async function searchCourses(courses: CourseRepository, query: Readonly<Record<string, string | undefined>>): Promise<CoursePage> {
	const details: ErrorDetail[] = [];
	const modality = parseEnum(query.modality, courseModalities, 'modality', 'modality must be online, in-person, or hybrid.', details);
	const status = parseEnum(query.status, courseStatuses, 'status', 'status must be draft, active, or retired.', details);
	const sort = parseSort(query.sort, details);
	const page = parsePage(query.page, details);
	const pageSize = parsePageSize(query.pageSize, details);
	if (details.length > 0 || modality === null || status === null || sort === null) {
		throw new ApplicationError('INVALID_QUERY_PARAMETER', QUERY_MESSAGE, details);
	}

	const keyword = normalizeOptional(query.q)?.toLowerCase();
	const tag = normalizeOptional(query.tag)?.toLowerCase();
	const matched = (await courses.list()).filter((course) => {
		if (modality !== undefined && course.modality !== modality) {
			return false;
		}
		if (status !== undefined && course.status !== status) {
			return false;
		}
		if (tag !== undefined && !course.tags.some((item) => item.toLowerCase() === tag)) {
			return false;
		}
		if (keyword !== undefined && !matchesKeyword(course, keyword)) {
			return false;
		}
		return true;
	});
	const items = [...matched].sort((left, right) => left[sort].localeCompare(right[sort], 'en') || left.id.localeCompare(right.id, 'en'));
	const start = (page - 1) * pageSize;
	return {
		items: items.slice(start, start + pageSize),
		page,
		pageSize,
		totalItems: items.length,
		totalPages: items.length === 0 ? 0 : Math.ceil(items.length / pageSize),
	};
}

function matchesKeyword(course: Course, keyword: string): boolean {
	return course.title.toLowerCase().includes(keyword) || course.summary.toLowerCase().includes(keyword) || course.tags.some((tag) => tag.toLowerCase().includes(keyword));
}

function normalizeOptional(value: string | undefined): string | undefined {
	if (value === undefined || value === '') {
		return undefined;
	}
	return value;
}

function parseEnum<T extends string>(value: string | undefined, allowed: readonly T[], field: string, message: string, details: ErrorDetail[]): T | undefined | null {
	if (value === undefined) {
		return undefined;
	}
	if (!isOneOf(allowed, value)) {
		details.push({ field, message });
		return null;
	}
	return value;
}

function parseSort(value: string | undefined, details: ErrorDetail[]): CourseSort | null {
	const parsed = parseEnum(value, courseSorts, 'sort', 'sort must be title, createdAt, or updatedAt.', details);
	return parsed === undefined ? 'title' : parsed;
}

function parsePage(value: string | undefined, details: ErrorDetail[]): number {
	if (value === undefined) {
		return 1;
	}
	if (!/^[1-9]\d*$/.test(value)) {
		details.push({ field: 'page', message: 'page must be an integer greater than or equal to 1.' });
		return 1;
	}
	return Number(value);
}

function parsePageSize(value: string | undefined, details: ErrorDetail[]): number {
	if (value === undefined) {
		return 10;
	}
	if (!/^[1-9]\d*$/.test(value) || Number(value) > 50) {
		details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		return 10;
	}
	return Number(value);
}
