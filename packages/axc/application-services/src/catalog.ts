import {
	type Course,
	type CoursePage,
	type CourseRepository,
	type CourseSortField,
	type EnrollmentRequest,
	type EnrollmentRequestRepository,
	type EnrollmentStatus,
	isCourseModality,
	isCourseSortField,
	isCourseStatus,
	isEnrollmentStatus,
} from '@axc/domain';

const justificationMin = 20;
const justificationMax = 500;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const blockingStatuses: readonly EnrollmentStatus[] = ['pending', 'approved'];
const transitions: Record<EnrollmentStatus, readonly EnrollmentStatus[]> = {
	pending: ['approved', 'rejected', 'cancelled'],
	approved: ['cancelled'],
	rejected: [],
	cancelled: [],
};

export interface CatalogDependencies {
	courses: CourseRepository;
	enrollmentRequests: EnrollmentRequestRepository;
	now: () => Date;
	newEnrollmentId: () => string;
}

export interface CourseSearchQuery {
	q?: string | undefined;
	modality?: string | undefined;
	status?: string | undefined;
	tag?: string | undefined;
	page?: string | undefined;
	pageSize?: string | undefined;
	sort?: string | undefined;
}

export interface EnrollmentListQuery {
	status?: string | undefined;
	courseId?: string | undefined;
	learnerEmail?: string | undefined;
}

export interface ServiceErrorDetail {
	field: string;
	message: string;
}

export interface ServiceError {
	status: 400 | 404 | 409;
	code: 'INVALID_QUERY_PARAMETER' | 'INVALID_REQUEST' | 'COURSE_NOT_FOUND' | 'COURSE_NOT_ACTIVE' | 'DUPLICATE_ACTIVE_REQUEST' | 'ENROLLMENT_REQUEST_NOT_FOUND' | 'INVALID_STATUS_TRANSITION';
	message: string;
	details: ServiceErrorDetail[];
}

export type ServiceResult<T> = { ok: true; value: T } | { ok: false; error: ServiceError };

export async function searchCourses(deps: CatalogDependencies, query: CourseSearchQuery): Promise<ServiceResult<CoursePage>> {
	const details: ServiceErrorDetail[] = [];
	const modalityValue = query.modality;
	const statusValue = query.status;
	const sortValue = query.sort;
	const page = readBoundedInt(query.page, 'page', 'page must be an integer greater than or equal to 1.', 1, undefined, details);
	const pageSize = readBoundedInt(query.pageSize, 'pageSize', 'pageSize must be between 1 and 50.', 10, 50, details);
	const modality = typeof modalityValue === 'string' && isCourseModality(modalityValue) ? modalityValue : undefined;
	if (modalityValue !== undefined && modality === undefined) {
		details.push({ field: 'modality', message: 'modality must be online, in-person, or hybrid.' });
	}
	const status = typeof statusValue === 'string' && isCourseStatus(statusValue) ? statusValue : undefined;
	if (statusValue !== undefined && status === undefined) {
		details.push({ field: 'status', message: 'status must be draft, active, or retired.' });
	}
	const sort = sortValue === undefined ? 'title' : isCourseSortField(sortValue) ? sortValue : undefined;
	if (sort === undefined) {
		details.push({ field: 'sort', message: 'sort must be title, createdAt, or updatedAt.' });
	}
	if (sort === undefined || details.length > 0) {
		return failure(400, 'INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', details);
	}

	const keyword = query.q?.trim().toLowerCase() ?? '';
	const tag = query.tag?.trim().toLowerCase() ?? '';
	const filtered = (await deps.courses.list()).filter((course) => matchesCourse(course, modality, status, tag, keyword));
	const sorted = [...filtered].sort((left, right) => compareCourses(left, right, sort));
	const totalItems = sorted.length;
	const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
	const start = (page - 1) * pageSize;
	return {
		ok: true,
		value: {
			items: sorted.slice(start, start + pageSize),
			page,
			pageSize,
			totalItems,
			totalPages,
		},
	};
}

export async function createEnrollmentRequest(deps: CatalogDependencies, body: unknown): Promise<ServiceResult<EnrollmentRequest>> {
	const record = asRecord(body);
	if (record === undefined) {
		return failure(400, 'INVALID_REQUEST', 'The request could not be completed.', [{ field: 'body', message: 'Request body must be a JSON object.' }]);
	}
	const courseId = readString(record, 'courseId')?.trim() ?? '';
	const learnerEmail = readString(record, 'learnerEmail')?.trim() ?? '';
	const justification = readString(record, 'justification');
	const details: ServiceErrorDetail[] = [];
	if (courseId === '') {
		details.push({ field: 'courseId', message: 'courseId is required.' });
	}
	if (!emailPattern.test(learnerEmail)) {
		details.push({ field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' });
	}
	if (justification === undefined || justification.length < justificationMin || justification.length > justificationMax) {
		details.push({ field: 'justification', message: 'justification must be between 20 and 500 characters.' });
	}
	if (details.length > 0 || justification === undefined) {
		return failure(400, 'INVALID_REQUEST', 'The request could not be completed.', details);
	}

	const course = await deps.courses.getById(courseId);
	if (course === undefined) {
		return failure(404, 'COURSE_NOT_FOUND', 'The course does not exist.', [{ field: 'courseId', message: 'The course does not exist.' }]);
	}
	if (course.status !== 'active') {
		return failure(409, 'COURSE_NOT_ACTIVE', 'Enrollment requests require an active course.', [{ field: 'courseId', message: 'The course must be active.' }]);
	}
	// shortcut: duplicate check is not atomic, upgrade when enrollment writes use a transaction
	const duplicate = (await deps.enrollmentRequests.list()).some((request) => request.courseId === courseId && sameEmail(request.learnerEmail, learnerEmail) && blockingStatuses.includes(request.status));
	if (duplicate) {
		return failure(409, 'DUPLICATE_ACTIVE_REQUEST', 'An active enrollment request already exists for this learner and course.', [
			{ field: 'learnerEmail', message: 'A pending or approved request already exists for this course.' },
		]);
	}

	const timestamp = deps.now().toISOString();
	const request: EnrollmentRequest = {
		id: deps.newEnrollmentId(),
		courseId,
		learnerEmail,
		justification,
		status: 'pending',
		createdAt: timestamp,
		updatedAt: timestamp,
		statusHistory: [
			{
				fromStatus: null,
				toStatus: 'pending',
				changedAt: timestamp,
				changedBy: 'system',
				reason: null,
			},
		],
	};
	await deps.enrollmentRequests.add(request);
	return { ok: true, value: request };
}

export async function getEnrollmentRequest(deps: CatalogDependencies, id: string): Promise<ServiceResult<EnrollmentRequest>> {
	const found = await deps.enrollmentRequests.getById(id);
	if (found === undefined) {
		return failure(404, 'ENROLLMENT_REQUEST_NOT_FOUND', 'The enrollment request does not exist.');
	}
	return { ok: true, value: found };
}

export async function listEnrollmentRequests(deps: CatalogDependencies, query: EnrollmentListQuery): Promise<ServiceResult<{ items: EnrollmentRequest[] }>> {
	const statusValue = query.status;
	const courseId = query.courseId;
	const learnerEmail = query.learnerEmail;
	const details: ServiceErrorDetail[] = [];
	const status = typeof statusValue === 'string' && isEnrollmentStatus(statusValue) ? statusValue : undefined;
	if (statusValue !== undefined && status === undefined) {
		details.push({ field: 'status', message: 'status must be pending, approved, rejected, or cancelled.' });
	}
	if (courseId !== undefined && courseId.trim() === '') {
		details.push({ field: 'courseId', message: 'courseId is required.' });
	}
	if (learnerEmail !== undefined && learnerEmail.trim() === '') {
		details.push({ field: 'learnerEmail', message: 'learnerEmail is required.' });
	}
	if (details.length > 0) {
		return failure(400, 'INVALID_REQUEST', 'The request could not be completed.', details);
	}

	const items = [...(await deps.enrollmentRequests.list())]
		.filter((request) => status === undefined || request.status === status)
		.filter((request) => courseId === undefined || request.courseId === courseId)
		.filter((request) => learnerEmail === undefined || sameEmail(request.learnerEmail, learnerEmail))
		.sort((left, right) => compareText(left.createdAt, right.createdAt) || compareText(left.id, right.id));
	return { ok: true, value: { items } };
}

export async function updateEnrollmentStatus(deps: CatalogDependencies, id: string, body: unknown): Promise<ServiceResult<EnrollmentRequest>> {
	const record = asRecord(body);
	if (record === undefined) {
		return failure(400, 'INVALID_REQUEST', 'The request could not be completed.', [{ field: 'body', message: 'Request body must be a JSON object.' }]);
	}
	const statusValue = readString(record, 'status');
	const changedBy = readString(record, 'changedBy')?.trim() ?? '';
	const reasonValue = readString(record, 'reason');
	const reason = reasonValue?.trim() ?? '';
	const nextStatus = statusValue !== undefined && isEnrollmentStatus(statusValue) ? statusValue : undefined;
	const details: ServiceErrorDetail[] = [];
	if (nextStatus === undefined) {
		details.push({ field: 'status', message: 'status must be pending, approved, rejected, or cancelled.' });
	}
	if (changedBy === '') {
		details.push({ field: 'changedBy', message: 'changedBy is required.' });
	}
	if (nextStatus === 'rejected' && reason === '') {
		details.push({ field: 'reason', message: 'reason is required when rejecting a request.' });
	}
	if (nextStatus === undefined || changedBy === '' || details.length > 0) {
		return failure(400, 'INVALID_REQUEST', 'The request could not be completed.', details);
	}

	const current = await deps.enrollmentRequests.getById(id);
	if (current === undefined) {
		return failure(404, 'ENROLLMENT_REQUEST_NOT_FOUND', 'The enrollment request does not exist.');
	}
	if (!transitions[current.status].includes(nextStatus)) {
		return failure(409, 'INVALID_STATUS_TRANSITION', 'The status transition is not allowed.');
	}

	const changedAt = deps.now().toISOString();
	const updated: EnrollmentRequest = {
		...current,
		status: nextStatus,
		updatedAt: changedAt,
		statusHistory: [
			...current.statusHistory,
			{
				fromStatus: current.status,
				toStatus: nextStatus,
				changedAt,
				changedBy,
				reason: reason === '' ? null : reason,
			},
		],
	};
	await deps.enrollmentRequests.save(updated);
	return { ok: true, value: updated };
}

function matchesCourse(course: Course, modality: Course['modality'] | undefined, status: Course['status'] | undefined, tag: string, keyword: string): boolean {
	if (modality !== undefined && course.modality !== modality) {
		return false;
	}
	if (status !== undefined && course.status !== status) {
		return false;
	}
	if (tag !== '' && !course.tags.some((item) => item.toLowerCase() === tag)) {
		return false;
	}
	if (keyword === '') {
		return true;
	}
	return [course.title, course.summary, ...course.tags].some((field) => field.toLowerCase().includes(keyword));
}

function compareCourses(left: Course, right: Course, sort: CourseSortField): number {
	return compareText(left[sort], right[sort]) || compareText(left.id, right.id);
}

function compareText(left: string, right: string): number {
	if (left < right) {
		return -1;
	}
	if (left > right) {
		return 1;
	}
	return 0;
}

function readBoundedInt(value: string | undefined, field: string, message: string, fallback: number, max: number | undefined, details: ServiceErrorDetail[]): number {
	if (value === undefined) {
		return fallback;
	}
	if (!/^[1-9]\d*$/.test(value)) {
		details.push({ field, message });
		return fallback;
	}
	const parsed = Number(value);
	if (max !== undefined && parsed > max) {
		details.push({ field, message });
		return fallback;
	}
	return parsed;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
	if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
		return value as Record<string, unknown>;
	}
	return undefined;
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
	const value = record[key];
	return typeof value === 'string' ? value : undefined;
}

function sameEmail(left: string, right: string): boolean {
	return left.toLowerCase() === right.toLowerCase();
}

function failure(status: ServiceError['status'], code: ServiceError['code'], message: string, details: ServiceErrorDetail[] = []): ServiceResult<never> {
	return { ok: false, error: { status, code, message, details } };
}
