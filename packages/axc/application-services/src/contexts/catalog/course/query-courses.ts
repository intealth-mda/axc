import type { CourseModality, CourseSearchCriteria, CourseSearchResult, CourseSortField, CourseStatus } from '@axc/domain';
import { COURSE_MODALITIES, COURSE_SORT_FIELDS, COURSE_STATUSES } from '@axc/domain';
import type { DataSources } from '@axc/persistence';

export interface CourseQueryInput {
	readonly q?: string;
	readonly modality?: string;
	readonly status?: string;
	readonly tag?: string;
	readonly page?: string;
	readonly pageSize?: string;
	readonly sort?: string;
}

export interface CourseQueryFieldError {
	readonly field: string;
	readonly message: string;
}

export interface CourseQueryErrorBody {
	readonly code: 'INVALID_QUERY_PARAMETER';
	readonly message: 'One or more query parameters are invalid.';
	readonly details: readonly CourseQueryFieldError[];
}

export type CourseQueryOutcome = { readonly ok: true; readonly result: CourseSearchResult } | { readonly ok: false; readonly error: CourseQueryErrorBody };

const PAGE_PATTERN = /^[1-9][0-9]*$/;
const PAGE_SIZE_MAX = 50;

function readAllowed<T extends string>(value: string, allowed: readonly T[]): T | undefined {
	for (const candidate of allowed) {
		if (candidate === value) {
			return candidate;
		}
	}
	return undefined;
}

function blankToUndefined(value: string | undefined): string | undefined {
	if (value === undefined) {
		return undefined;
	}
	const trimmed = value.trim();
	if (trimmed === '') {
		return undefined;
	}
	return trimmed;
}

function readPositiveInteger(value: string): number | undefined {
	if (!PAGE_PATTERN.test(value)) {
		return undefined;
	}
	const parsed = Number(value);
	if (!Number.isSafeInteger(parsed)) {
		return undefined;
	}
	return parsed;
}

function readModality(value: string | undefined, details: CourseQueryFieldError[]): CourseModality | undefined {
	if (value === undefined) {
		return undefined;
	}
	const matched = readAllowed(value.trim(), COURSE_MODALITIES);
	if (matched === undefined) {
		details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
		return undefined;
	}
	return matched;
}

function readStatus(value: string | undefined, details: CourseQueryFieldError[]): CourseStatus | undefined {
	if (value === undefined) {
		return undefined;
	}
	const matched = readAllowed(value.trim(), COURSE_STATUSES);
	if (matched === undefined) {
		details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
		return undefined;
	}
	return matched;
}

function readPage(value: string | undefined, details: CourseQueryFieldError[]): number | undefined {
	if (value === undefined) {
		return 1;
	}
	const parsed = readPositiveInteger(value.trim());
	if (parsed === undefined) {
		details.push({ field: 'page', message: 'page must be an integer greater than or equal to 1.' });
		return undefined;
	}
	return parsed;
}

function readPageSize(value: string | undefined, details: CourseQueryFieldError[]): number | undefined {
	if (value === undefined) {
		return 10;
	}
	const parsed = readPositiveInteger(value.trim());
	if (parsed === undefined || parsed > PAGE_SIZE_MAX) {
		details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		return undefined;
	}
	return parsed;
}

function readSort(value: string | undefined, details: CourseQueryFieldError[]): CourseSortField | undefined {
	if (value === undefined) {
		return 'title';
	}
	const matched = readAllowed(value.trim(), COURSE_SORT_FIELDS);
	if (matched === undefined) {
		details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
		return undefined;
	}
	return matched;
}

export const queryCourses =
	(dataSources: DataSources) =>
	(input: CourseQueryInput): Promise<CourseQueryOutcome> => {
		const details: CourseQueryFieldError[] = [];
		const modality = readModality(input.modality, details);
		const status = readStatus(input.status, details);
		const page = readPage(input.page, details);
		const pageSize = readPageSize(input.pageSize, details);
		const sort = readSort(input.sort, details);
		if (details.length > 0 || page === undefined || pageSize === undefined || sort === undefined) {
			const failure: CourseQueryOutcome = {
				ok: false,
				error: {
					code: 'INVALID_QUERY_PARAMETER',
					message: 'One or more query parameters are invalid.',
					details,
				},
			};
			return Promise.resolve(failure);
		}

		const q = blankToUndefined(input.q);
		const tag = blankToUndefined(input.tag);
		const criteria: CourseSearchCriteria = {
			page,
			pageSize,
			sort,
			...(q === undefined ? {} : { q }),
			...(tag === undefined ? {} : { tag }),
			...(modality === undefined ? {} : { modality }),
			...(status === undefined ? {} : { status }),
		};

		return dataSources.readonlyDataSource.course.search(criteria).then((result): CourseQueryOutcome => ({ ok: true, result }));
	};
