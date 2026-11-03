const COURSE_MODALITIES = ['online', 'in-person', 'hybrid'] as const;
const COURSE_STATUSES = ['draft', 'active', 'retired'] as const;
const COURSE_SORTS = ['title', 'createdAt', 'updatedAt'] as const;

export type CourseModality = (typeof COURSE_MODALITIES)[number];
export type CourseStatus = (typeof COURSE_STATUSES)[number];
export type CourseSort = (typeof COURSE_SORTS)[number];

export interface Course {
	id: string;
	title: string;
	summary: string;
	modality: CourseModality;
	status: CourseStatus;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

export interface CourseQueryInput {
	q: string | undefined;
	modality: string | undefined;
	status: string | undefined;
	tag: string | undefined;
	page: string | undefined;
	pageSize: string | undefined;
	sort: string | undefined;
}

export interface CourseQuery {
	q?: string;
	modality?: CourseModality;
	status?: CourseStatus;
	tag?: string;
	page: number;
	pageSize: number;
	sort: CourseSort;
}

export interface CoursePage {
	items: Course[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

export interface CourseQueryDetail {
	field: string;
	message: string;
}

export interface CourseQueryErrorBody {
	error: {
		code: 'INVALID_QUERY_PARAMETER';
		message: 'One or more query parameters are invalid.';
		details: CourseQueryDetail[];
	};
}

export type CourseQueryResult = { ok: true; query: CourseQuery } | { ok: false; error: CourseQueryErrorBody };

const MODALITY_MESSAGE = 'modality must be online, in-person, or hybrid.';
const STATUS_MESSAGE = 'status must be draft, active, or retired.';
const PAGE_MESSAGE = 'page must be an integer greater than or equal to 1.';
const PAGE_SIZE_MESSAGE = 'pageSize must be between 1 and 50.';
const SORT_MESSAGE = 'sort must be title, createdAt, or updatedAt.';

export function parseCourseQuery(input: CourseQueryInput): CourseQueryResult {
	const details: CourseQueryDetail[] = [];
	const modality = readChoice(COURSE_MODALITIES, input.modality, 'modality', MODALITY_MESSAGE, details);
	const status = readChoice(COURSE_STATUSES, input.status, 'status', STATUS_MESSAGE, details);
	const page = readPage(input.page, details);
	const pageSize = readPageSize(input.pageSize, details);
	const sort = readChoice(COURSE_SORTS, input.sort, 'sort', SORT_MESSAGE, details) ?? 'title';

	if (details.length > 0 || page === undefined || pageSize === undefined) {
		return {
			ok: false,
			error: {
				error: {
					code: 'INVALID_QUERY_PARAMETER',
					message: 'One or more query parameters are invalid.',
					details,
				},
			},
		};
	}

	const q = blankToUndefined(input.q);
	const tag = blankToUndefined(input.tag);
	return {
		ok: true,
		query: {
			page,
			pageSize,
			sort,
			...(q === undefined ? {} : { q }),
			...(modality === undefined ? {} : { modality }),
			...(status === undefined ? {} : { status }),
			...(tag === undefined ? {} : { tag }),
		},
	};
}

export function searchCourses(courses: readonly Course[], query: CourseQuery): CoursePage {
	const matched = courses.filter((course) => matchesCourse(course, query)).sort((left, right) => compareCourses(query.sort, left, right));
	const start = (query.page - 1) * query.pageSize;
	const totalItems = matched.length;
	return {
		items: matched.slice(start, start + query.pageSize),
		page: query.page,
		pageSize: query.pageSize,
		totalItems,
		totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.pageSize),
	};
}

function matchesCourse(course: Course, query: CourseQuery): boolean {
	const keyword = query.q?.toLowerCase();
	if (keyword !== undefined && !textIncludes(course, keyword)) {
		return false;
	}
	if (query.modality !== undefined && course.modality !== query.modality) {
		return false;
	}
	if (query.status !== undefined && course.status !== query.status) {
		return false;
	}
	const tag = query.tag?.toLowerCase();
	if (tag !== undefined && !course.tags.some((value) => value.toLowerCase() === tag)) {
		return false;
	}
	return true;
}

function textIncludes(course: Course, keyword: string): boolean {
	return course.title.toLowerCase().includes(keyword) || course.summary.toLowerCase().includes(keyword) || course.tags.some((value) => value.toLowerCase().includes(keyword));
}

function compareCourses(sort: CourseSort, left: Course, right: Course): number {
	if (left[sort] < right[sort]) {
		return -1;
	}
	if (left[sort] > right[sort]) {
		return 1;
	}
	if (left.id < right.id) {
		return -1;
	}
	if (left.id > right.id) {
		return 1;
	}
	return 0;
}

function readChoice<T extends string>(values: readonly T[], value: string | undefined, field: string, message: string, details: CourseQueryDetail[]): T | undefined {
	if (value === undefined) {
		return undefined;
	}
	if (values.some((candidate) => candidate === value)) {
		return value as T;
	}
	details.push({ field, message });
	return undefined;
}

function readPage(value: string | undefined, details: CourseQueryDetail[]): number | undefined {
	if (value === undefined) {
		return 1;
	}
	const parsed = readInteger(value);
	if (parsed === undefined) {
		details.push({ field: 'page', message: PAGE_MESSAGE });
		return undefined;
	}
	return parsed;
}

function readPageSize(value: string | undefined, details: CourseQueryDetail[]): number | undefined {
	if (value === undefined) {
		return 10;
	}
	const parsed = readInteger(value);
	if (parsed === undefined || parsed > 50) {
		details.push({ field: 'pageSize', message: PAGE_SIZE_MESSAGE });
		return undefined;
	}
	return parsed;
}

function readInteger(value: string): number | undefined {
	if (!/^[1-9]\d*$/.test(value)) {
		return undefined;
	}
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function blankToUndefined(value: string | undefined): string | undefined {
	return value === undefined || value === '' ? undefined : value;
}
