// Status stays with the code so REST and tests share one error table.
const QUERY_MESSAGE = 'One or more query parameters are invalid.';
const REQUEST_MESSAGE = 'The request could not be completed.';

const COURSE_MODALITIES = ['online', 'in-person', 'hybrid'] as const;
const COURSE_STATUSES = ['draft', 'active', 'retired'] as const;
const COURSE_SORTS = ['title', 'createdAt', 'updatedAt'] as const;
const ENROLLMENT_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'] as const;
const COURSE_QUERY_FIELDS = new Set(['q', 'modality', 'status', 'tag', 'page', 'pageSize', 'sort']);
const ENROLLMENT_QUERY_FIELDS = new Set(['status', 'courseId', 'learnerEmail']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CourseModality = (typeof COURSE_MODALITIES)[number];
export type CourseStatus = (typeof COURSE_STATUSES)[number];
export type CourseSort = (typeof COURSE_SORTS)[number];
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

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

export interface CourseSearchResult {
	items: Course[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

export interface StatusHistoryEntry {
	fromStatus: EnrollmentStatus | null;
	toStatus: EnrollmentStatus;
	changedAt: string;
	changedBy: string;
	reason: string | null;
}

export interface EnrollmentRequest {
	id: string;
	courseId: string;
	learnerEmail: string;
	justification: string;
	status: EnrollmentStatus;
	createdAt: string;
	updatedAt: string;
	statusHistory: StatusHistoryEntry[];
}

export interface CourseRepository {
	list(): Promise<readonly Course[]>;
}

export interface EnrollmentRequestRepository {
	list(): Promise<readonly EnrollmentRequest[]>;
	findById(id: string): Promise<EnrollmentRequest | undefined>;
	save(request: EnrollmentRequest): Promise<void>;
}

export type RawQuery = Readonly<Record<string, string | undefined>>;

interface CatalogErrorDetail {
	field: string;
	message: string;
}

interface CatalogError {
	code: 'INVALID_QUERY_PARAMETER' | 'INVALID_REQUEST' | 'COURSE_NOT_FOUND' | 'COURSE_NOT_ACTIVE' | 'DUPLICATE_ACTIVE_REQUEST' | 'ENROLLMENT_REQUEST_NOT_FOUND' | 'INVALID_STATUS_TRANSITION';
	message: string;
	details: CatalogErrorDetail[];
}

export type CatalogResult<T> = { ok: true; value: T } | { ok: false; status: 400 | 404 | 409; error: CatalogError };

export function searchCourses(courses: readonly Course[], query: RawQuery): CatalogResult<CourseSearchResult> {
	const details: CatalogErrorDetail[] = [];
	rejectUnknown(query, COURSE_QUERY_FIELDS, details);
	const modality = readEnum(at(query, 'modality'), 'modality', COURSE_MODALITIES, 'modality must be online, in-person, or hybrid.', details);
	const status = readEnum(at(query, 'status'), 'status', COURSE_STATUSES, 'status must be draft, active, or retired.', details);
	const sort = readEnum(at(query, 'sort'), 'sort', COURSE_SORTS, 'sort must be title, createdAt, or updatedAt.', details) ?? 'title';
	const page = readInt(at(query, 'page'), 'page', 1, Number.POSITIVE_INFINITY, 'page must be an integer greater than or equal to 1.', details, 1);
	const pageSize = readInt(at(query, 'pageSize'), 'pageSize', 1, 50, 'pageSize must be between 1 and 50.', details, 10);
	if (details.length > 0) {
		return fail(400, 'INVALID_QUERY_PARAMETER', QUERY_MESSAGE, details);
	}

	const keyword = blankToUndefined(at(query, 'q'))?.toLowerCase();
	const tag = blankToUndefined(at(query, 'tag'))?.toLowerCase();
	const filtered = courses.filter((course) => {
		if (modality !== undefined && course.modality !== modality) {
			return false;
		}
		if (status !== undefined && course.status !== status) {
			return false;
		}
		if (tag !== undefined && !course.tags.some((courseTag) => courseTag.toLowerCase() === tag)) {
			return false;
		}
		if (keyword !== undefined) {
			const haystack = [course.title, course.summary, ...course.tags];
			return haystack.some((value) => value.toLowerCase().includes(keyword));
		}
		return true;
	});
	const sorted = [...filtered].sort((left, right) => {
		const compared = left[sort].localeCompare(right[sort]);
		return compared === 0 ? left.id.localeCompare(right.id) : compared;
	});
	const totalItems = sorted.length;
	const start = (page - 1) * pageSize;
	return {
		ok: true,
		value: {
			items: sorted.slice(start, start + pageSize).map(copyCourse),
			page,
			pageSize,
			totalItems,
			totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize),
		},
	};
}

export function createEnrollmentRequest(input: { courses: readonly Course[]; requests: readonly EnrollmentRequest[]; body: unknown; id: () => string; now: () => string }): CatalogResult<EnrollmentRequest> {
	if (!isRecord(input.body)) {
		return fail(400, 'INVALID_REQUEST', REQUEST_MESSAGE, [{ field: 'body', message: 'Request body must be a JSON object.' }]);
	}
	const details: CatalogErrorDetail[] = [];
	const courseId = readRequiredText(prop(input.body, 'courseId'), 'courseId', 'courseId is required.', details);
	const learnerEmail = readEmail(prop(input.body, 'learnerEmail'), details);
	const justification = readJustification(prop(input.body, 'justification'), details);
	if (details.length > 0 || courseId === undefined || learnerEmail === undefined || justification === undefined) {
		return fail(400, 'INVALID_REQUEST', REQUEST_MESSAGE, details);
	}

	const course = input.courses.find((item) => item.id === courseId);
	if (course === undefined) {
		return fail(404, 'COURSE_NOT_FOUND', REQUEST_MESSAGE, [{ field: 'courseId', message: 'Course not found.' }]);
	}
	if (course.status !== 'active') {
		return fail(409, 'COURSE_NOT_ACTIVE', REQUEST_MESSAGE, [{ field: 'courseId', message: 'Course is not active.' }]);
	}
	const duplicate = input.requests.some((request) => request.courseId === courseId && request.learnerEmail.toLowerCase() === learnerEmail.toLowerCase() && isActiveEnrollment(request.status));
	if (duplicate) {
		return duplicateActiveRequest();
	}

	const timestamp = input.now();
	return {
		ok: true,
		value: {
			id: input.id(),
			courseId,
			learnerEmail,
			justification,
			status: 'pending',
			createdAt: timestamp,
			updatedAt: timestamp,
			statusHistory: [{ fromStatus: null, toStatus: 'pending', changedAt: timestamp, changedBy: 'system', reason: null }],
		},
	};
}

export function getEnrollmentRequest(request: EnrollmentRequest | undefined): CatalogResult<EnrollmentRequest> {
	if (request === undefined) {
		return fail(404, 'ENROLLMENT_REQUEST_NOT_FOUND', REQUEST_MESSAGE, [{ field: 'id', message: 'Enrollment request not found.' }]);
	}
	return { ok: true, value: copyRequest(request) };
}

export function listEnrollmentRequests(requests: readonly EnrollmentRequest[], query: RawQuery): CatalogResult<EnrollmentRequest[]> {
	const details: CatalogErrorDetail[] = [];
	rejectUnknown(query, ENROLLMENT_QUERY_FIELDS, details);
	const status = readEnum(at(query, 'status'), 'status', ENROLLMENT_STATUSES, 'status must be pending, approved, rejected, or cancelled.', details);
	if (details.length > 0) {
		return fail(400, 'INVALID_REQUEST', REQUEST_MESSAGE, details);
	}
	const courseId = blankToUndefined(at(query, 'courseId'));
	const learnerEmail = blankToUndefined(at(query, 'learnerEmail'))?.toLowerCase();
	const items = requests.filter((request) => {
		if (status !== undefined && request.status !== status) {
			return false;
		}
		if (courseId !== undefined && request.courseId !== courseId) {
			return false;
		}
		if (learnerEmail !== undefined && request.learnerEmail.toLowerCase() !== learnerEmail) {
			return false;
		}
		return true;
	});
	return { ok: true, value: items.map(copyRequest) };
}

export function changeEnrollmentStatus(request: EnrollmentRequest | undefined, body: unknown, now: () => string): CatalogResult<EnrollmentRequest> {
	if (request === undefined) {
		return fail(404, 'ENROLLMENT_REQUEST_NOT_FOUND', REQUEST_MESSAGE, [{ field: 'id', message: 'Enrollment request not found.' }]);
	}
	if (!isRecord(body)) {
		return fail(400, 'INVALID_REQUEST', REQUEST_MESSAGE, [{ field: 'body', message: 'Request body must be a JSON object.' }]);
	}

	const details: CatalogErrorDetail[] = [];
	const statusValue = prop(body, 'status');
	const changedByValue = prop(body, 'changedBy');
	const reasonValue = prop(body, 'reason');
	const statusText = typeof statusValue === 'string' ? statusValue : undefined;
	const status = readEnum(statusText, 'status', ENROLLMENT_STATUSES, 'status must be pending, approved, rejected, or cancelled.', details);
	if (status === undefined && !details.some((detail) => detail.field === 'status')) {
		details.push({ field: 'status', message: 'status must be pending, approved, rejected, or cancelled.' });
	}
	const changedBy = readRequiredText(changedByValue, 'changedBy', 'changedBy is required.', details);
	let reason: string | null = null;
	if (reasonValue !== undefined && reasonValue !== null) {
		if (typeof reasonValue !== 'string') {
			details.push({ field: 'reason', message: 'reason must be a string.' });
		} else {
			reason = reasonValue.trim();
		}
	}
	if (status === 'rejected' && (reasonValue === undefined || reasonValue === null || (typeof reasonValue === 'string' && reasonValue.trim() === ''))) {
		details.push({ field: 'reason', message: 'Rejection requires a non-empty reason.' });
	}
	if (details.length > 0 || status === undefined || changedBy === undefined) {
		return fail(400, 'INVALID_REQUEST', REQUEST_MESSAGE, details);
	}
	if (!canTransition(request.status, status)) {
		return fail(409, 'INVALID_STATUS_TRANSITION', REQUEST_MESSAGE, [{ field: 'status', message: 'The status transition is not allowed.' }]);
	}

	const changedAt = now();
	const storedReason = reason === null || reason === '' ? null : reason;
	return {
		ok: true,
		value: {
			...copyRequest(request),
			status,
			updatedAt: changedAt,
			statusHistory: [...request.statusHistory.map(copyHistory), { fromStatus: request.status, toStatus: status, changedAt, changedBy, reason: storedReason }],
		},
	};
}

function duplicateActiveRequest(): CatalogResult<never> {
	return fail(409, 'DUPLICATE_ACTIVE_REQUEST', REQUEST_MESSAGE, [{ field: 'learnerEmail', message: 'A pending or approved request already exists for this learner and course.' }]);
}

function canTransition(from: EnrollmentStatus, to: EnrollmentStatus): boolean {
	if (from === 'pending') {
		return to === 'approved' || to === 'rejected' || to === 'cancelled';
	}
	return from === 'approved' && to === 'cancelled';
}

function isActiveEnrollment(status: EnrollmentStatus): boolean {
	return status === 'pending' || status === 'approved';
}

function readEmail(value: unknown, details: CatalogErrorDetail[]): string | undefined {
	if (typeof value !== 'string' || !EMAIL_PATTERN.test(value.trim())) {
		details.push({ field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' });
		return undefined;
	}
	return value.trim();
}

function readJustification(value: unknown, details: CatalogErrorDetail[]): string | undefined {
	if (typeof value !== 'string' || value.length < 20 || value.length > 500) {
		details.push({ field: 'justification', message: 'justification must be between 20 and 500 characters.' });
		return undefined;
	}
	return value;
}

function readRequiredText(value: unknown, field: string, message: string, details: CatalogErrorDetail[]): string | undefined {
	if (typeof value !== 'string' || value.trim() === '') {
		details.push({ field, message });
		return undefined;
	}
	return value.trim();
}

function readEnum<T extends string>(value: string | undefined, field: string, allowed: readonly T[], message: string, details: CatalogErrorDetail[]): T | undefined {
	if (value === undefined || value === '') {
		if (value === '') {
			details.push({ field, message });
		}
		return undefined;
	}
	if (!(allowed as readonly string[]).includes(value)) {
		details.push({ field, message });
		return undefined;
	}
	return value as T;
}

function readInt(value: string | undefined, field: string, min: number, max: number, message: string, details: CatalogErrorDetail[], fallback: number): number {
	if (value === undefined) {
		return fallback;
	}
	if (!/^[1-9]\d*$/.test(value)) {
		details.push({ field, message });
		return fallback;
	}
	const parsed = Number(value);
	if (parsed < min || parsed > max) {
		details.push({ field, message });
		return fallback;
	}
	return parsed;
}

function rejectUnknown(query: RawQuery, allowed: ReadonlySet<string>, details: CatalogErrorDetail[]): void {
	for (const field of Object.keys(query)) {
		if (!allowed.has(field)) {
			details.push({ field, message: `${field} is not a supported query parameter.` });
		}
	}
}

function at(query: RawQuery, key: string): string | undefined {
	return query[key];
}

function prop(body: Record<string, unknown>, key: string): unknown {
	return body[key];
}

function blankToUndefined(value: string | undefined): string | undefined {
	if (value === undefined || value === '') {
		return undefined;
	}
	return value;
}

function fail(status: 400 | 404 | 409, code: CatalogError['code'], message: string, details: CatalogErrorDetail[]): CatalogResult<never> {
	return { ok: false, status, error: { code, message, details } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function copyCourse(course: Course): Course {
	return { ...course, tags: [...course.tags] };
}

function copyRequest(request: EnrollmentRequest): EnrollmentRequest {
	return { ...request, statusHistory: request.statusHistory.map(copyHistory) };
}

function copyHistory(entry: StatusHistoryEntry): StatusHistoryEntry {
	return { ...entry };
}
