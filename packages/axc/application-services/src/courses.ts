import { type Course, type CourseModality, type CourseStatus, catalogCourses, courseModalities, courseStatuses } from '@axc/domain';

const courseSorts = ['title', 'createdAt', 'updatedAt'] as const;

const modalityMessage = 'modality must be online, in-person, or hybrid.';
const statusMessage = 'status must be draft, active, or retired.';
const pageMessage = 'page must be an integer greater than or equal to 1.';
const pageSizeMessage = 'pageSize must be between 1 and 50.';
const sortMessage = 'sort must be title, createdAt, or updatedAt.';
const invalidQueryMessage = 'One or more query parameters are invalid.';

export interface CourseSearchInput {
	q?: string | undefined;
	modality?: string | undefined;
	status?: string | undefined;
	tag?: string | undefined;
	page?: string | undefined;
	pageSize?: string | undefined;
	sort?: string | undefined;
}

export interface CoursePage {
	items: Course[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

export interface InvalidQueryParameterResponse {
	error: {
		code: 'INVALID_QUERY_PARAMETER';
		message: typeof invalidQueryMessage;
		details: Array<{ field: string; message: string }>;
	};
}

export type CourseSearchResult = { ok: true; body: CoursePage } | { ok: false; body: InvalidQueryParameterResponse };

type QueryDetail = InvalidQueryParameterResponse['error']['details'][number];

export function searchCourses(input: CourseSearchInput): CourseSearchResult {
	const details: QueryDetail[] = [];
	const modality = readChoice(input.modality, courseModalities, 'modality', modalityMessage, details);
	const status = readChoice(input.status, courseStatuses, 'status', statusMessage, details);
	const page = readBounded(input.page, 1, Number.MAX_SAFE_INTEGER, 'page', pageMessage, details);
	const pageSize = readBounded(input.pageSize, 10, 50, 'pageSize', pageSizeMessage, details);
	const sort = readChoice(input.sort, courseSorts, 'sort', sortMessage, details) ?? 'title';
	if (details.length > 0) {
		return { ok: false, body: { error: { code: 'INVALID_QUERY_PARAMETER', message: invalidQueryMessage, details } } };
	}

	const q = input.q ?? '';
	const tag = input.tag ?? '';
	const matched = catalogCourses.filter((course) => matches(course, q, modality, status, tag));
	const items = [...matched]
		.sort((left, right) => left[sort].localeCompare(right[sort], 'en'))
		.slice((page - 1) * pageSize, page * pageSize)
		.map(copyCourse);
	const totalItems = matched.length;
	return {
		ok: true,
		body: {
			items,
			page,
			pageSize,
			totalItems,
			totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize),
		},
	};
}

function readChoice<T extends string>(value: string | undefined, allowed: readonly T[], field: string, message: string, details: QueryDetail[]): T | undefined {
	if (value === undefined) {
		return undefined;
	}
	if (allowed.some((item) => item === value)) {
		return value as T;
	}
	details.push({ field, message });
	return undefined;
}

function readBounded(value: string | undefined, fallback: number, max: number, field: string, message: string, details: QueryDetail[]): number {
	if (value === undefined) {
		return fallback;
	}
	if (!/^[1-9]\d*$/.test(value)) {
		details.push({ field, message });
		return fallback;
	}
	const parsed = Number(value);
	if (!Number.isSafeInteger(parsed) || parsed > max) {
		details.push({ field, message });
		return fallback;
	}
	return parsed;
}

function matches(course: Course, q: string, modality: CourseModality | undefined, status: CourseStatus | undefined, tag: string): boolean {
	if (modality !== undefined && course.modality !== modality) {
		return false;
	}
	if (status !== undefined && course.status !== status) {
		return false;
	}
	if (tag !== '' && !course.tags.some((item) => item.toLowerCase() === tag.toLowerCase())) {
		return false;
	}
	if (q !== '') {
		const needle = q.toLowerCase();
		const fields = [course.title, course.summary, ...course.tags];
		if (!fields.some((field) => field.toLowerCase().includes(needle))) {
			return false;
		}
	}
	return true;
}

function copyCourse(course: Course): Course {
	return {
		id: course.id,
		title: course.title,
		summary: course.summary,
		modality: course.modality,
		status: course.status,
		tags: [...course.tags],
		createdAt: course.createdAt,
		updatedAt: course.updatedAt,
	};
}
