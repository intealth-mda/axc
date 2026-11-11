import { type CourseModality, type CourseProps, type CourseStatus, CourseTagList, courseModalities, courseStatuses } from '@axc/domain';
import type { DataSources } from '@axc/persistence';

const courseSorts = ['title', 'createdAt', 'updatedAt'] as const;
export type CourseSort = (typeof courseSorts)[number];

export interface CourseSearchQuery {
	q?: string;
	modality?: CourseModality;
	status?: CourseStatus;
	tag?: string;
	page: number;
	pageSize: number;
	sort: CourseSort;
}

export interface CourseItem {
	id: string;
	title: string;
	summary: string;
	modality: CourseModality;
	status: CourseStatus;
	tags: string[];
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

export interface CourseQueryFieldError {
	field: string;
	message: string;
}

type ParseCourseQueryResult = { ok: true; query: CourseSearchQuery } | { ok: false; details: CourseQueryFieldError[] };

const allowedFields = ['q', 'modality', 'status', 'tag', 'page', 'pageSize', 'sort'] as const;

function readParam(params: Readonly<Record<string, string>>, key: string): string | undefined {
	// biome-ignore lint/complexity/useLiteralKeys: index signature key
	return params[key];
}

function isModality(value: string): value is CourseModality {
	return courseModalities.some((item) => item === value);
}

function isStatus(value: string): value is CourseStatus {
	return courseStatuses.some((item) => item === value);
}

function isSort(value: string): value is CourseSort {
	return courseSorts.some((item) => item === value);
}

function isPositiveInteger(value: string): boolean {
	return /^[1-9]\d*$/.test(value);
}

export function parseCourseSearchQuery(params: Readonly<Record<string, string>>): ParseCourseQueryResult {
	const details: CourseQueryFieldError[] = [];

	for (const field of Object.keys(params)) {
		if (!allowedFields.some((allowed) => allowed === field)) {
			details.push({ field, message: 'Unknown query parameter.' });
		}
	}

	const q = readParam(params, 'q');
	const modalityRaw = readParam(params, 'modality');
	const statusRaw = readParam(params, 'status');
	const tagRaw = readParam(params, 'tag');
	const pageRaw = readParam(params, 'page');
	const pageSizeRaw = readParam(params, 'pageSize');
	const sortRaw = readParam(params, 'sort');

	let modality: CourseModality | undefined;
	if (modalityRaw !== undefined) {
		if (!isModality(modalityRaw)) {
			details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
		} else {
			modality = modalityRaw;
		}
	}

	let status: CourseStatus | undefined;
	if (statusRaw !== undefined) {
		if (!isStatus(statusRaw)) {
			details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
		} else {
			status = statusRaw;
		}
	}

	let tag: string | undefined;
	if (tagRaw !== undefined) {
		if (tagRaw.trim() === '') {
			details.push({ field: 'tag', message: 'tag must be a non-empty string.' });
		} else {
			tag = tagRaw;
		}
	}

	let page = 1;
	if (pageRaw !== undefined) {
		if (!isPositiveInteger(pageRaw)) {
			details.push({ field: 'page', message: 'page must be an integer greater than or equal to 1.' });
		} else {
			page = Number(pageRaw);
		}
	}

	let pageSize = 10;
	if (pageSizeRaw !== undefined) {
		if (!isPositiveInteger(pageSizeRaw) || Number(pageSizeRaw) > 50) {
			details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		} else {
			pageSize = Number(pageSizeRaw);
		}
	}

	let sort: CourseSort = 'title';
	if (sortRaw !== undefined) {
		if (!isSort(sortRaw)) {
			details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
		} else {
			sort = sortRaw;
		}
	}

	if (details.length > 0) {
		return { ok: false, details };
	}

	const query: CourseSearchQuery = {
		page,
		pageSize,
		sort,
		...(q !== undefined && q !== '' ? { q } : {}),
		...(modality !== undefined ? { modality } : {}),
		...(status !== undefined ? { status } : {}),
		...(tag !== undefined ? { tag } : {}),
	};
	return { ok: true, query };
}

function matches(props: CourseProps, query: CourseSearchQuery): boolean {
	const tags = CourseTagList.create(props.tags);
	if (query.q !== undefined && query.q !== '') {
		const needle = query.q.toLowerCase();
		const inText = props.title.toLowerCase().includes(needle) || props.summary.toLowerCase().includes(needle);
		if (!inText && !tags.includesText(query.q)) {
			return false;
		}
	}
	if (query.modality !== undefined && props.modality !== query.modality) {
		return false;
	}
	if (query.status !== undefined && props.status !== query.status) {
		return false;
	}
	if (query.tag !== undefined && !tags.contains(query.tag)) {
		return false;
	}
	return true;
}

function compareText(left: string, right: string): number {
	return left.localeCompare(right, 'en', { sensitivity: 'base' });
}

function compareCourses(left: CourseProps, right: CourseProps, sort: CourseSort): number {
	if (sort === 'createdAt' || sort === 'updatedAt') {
		const byDate = left[sort].localeCompare(right[sort]);
		if (byDate !== 0) {
			return byDate;
		}
	} else {
		const byTitle = compareText(left.title, right.title);
		if (byTitle !== 0) {
			return byTitle;
		}
	}
	return left.id.localeCompare(right.id);
}

function toItem(props: CourseProps): CourseItem {
	return {
		id: props.id,
		title: props.title,
		summary: props.summary,
		modality: props.modality,
		status: props.status,
		tags: [...props.tags],
		createdAt: props.createdAt,
		updatedAt: props.updatedAt,
	};
}

export const queryCourses =
	(dataSources: DataSources) =>
	async (query: CourseSearchQuery): Promise<CoursePage> => {
		const courses = await dataSources.readonlyDataSource.course.list();
		const filtered = courses.filter((course) => matches(course.props, query));
		const sorted = [...filtered].sort((left, right) => compareCourses(left.props, right.props, query.sort));
		const start = (query.page - 1) * query.pageSize;
		const items = sorted.slice(start, start + query.pageSize).map((course) => toItem(course.props));
		const totalItems = sorted.length;
		const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / query.pageSize);
		return {
			items,
			page: query.page,
			pageSize: query.pageSize,
			totalItems,
			totalPages,
		};
	};
