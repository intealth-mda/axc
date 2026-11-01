import type { Course, QueryParameterError } from './courses.ts';

export type EnrollmentRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface StatusHistoryEntry {
	fromStatus: EnrollmentRequestStatus | null;
	toStatus: EnrollmentRequestStatus;
	changedAt: string;
	changedBy: string;
	reason: string | null;
}

export interface EnrollmentRequest {
	id: string;
	courseId: string;
	learnerEmail: string;
	justification: string;
	status: EnrollmentRequestStatus;
	createdAt: string;
	updatedAt: string;
	statusHistory: StatusHistoryEntry[];
}

export type EnrollmentErrorCode = 'INVALID_REQUEST' | 'COURSE_NOT_FOUND' | 'COURSE_NOT_ACTIVE' | 'DUPLICATE_ACTIVE_REQUEST' | 'ENROLLMENT_REQUEST_NOT_FOUND' | 'INVALID_STATUS_TRANSITION';

export interface EnrollmentError {
	code: EnrollmentErrorCode;
	message: string;
	details: QueryParameterError[];
}

export type EnrollmentResult<T> = { ok: true; value: T } | { ok: false; error: EnrollmentError };

/** Raw query-string values, validated by list. */
export type EnrollmentListParams = Partial<Record<'status' | 'courseId' | 'learnerEmail', string>>;

export interface EnrollmentRequestService {
	create(body: unknown): EnrollmentResult<EnrollmentRequest>;
	get(id: string): EnrollmentResult<EnrollmentRequest>;
	list(params: EnrollmentListParams): EnrollmentResult<EnrollmentRequest[]>;
	updateStatus(id: string, body: unknown): EnrollmentResult<EnrollmentRequest>;
}

const STATUSES: readonly string[] = ['pending', 'approved', 'rejected', 'cancelled'];
const ALLOWED_TRANSITIONS: readonly string[] = ['pending->approved', 'pending->rejected', 'pending->cancelled', 'approved->cancelled'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVALID_MESSAGE = 'The request could not be completed.';
const STATUS_DETAIL: QueryParameterError = { field: 'status', message: 'status must be one of: pending, approved, rejected, cancelled.' };
const BODY_DETAIL: QueryParameterError = { field: 'body', message: 'The request body must be a JSON object.' };

function fail<T>(code: EnrollmentErrorCode, message: string, details: QueryParameterError[] = []): EnrollmentResult<T> {
	return { ok: false, error: { code, message, details } };
}

function invalid<T>(details: QueryParameterError[]): EnrollmentResult<T> {
	return fail('INVALID_REQUEST', INVALID_MESSAGE, details);
}

/** The body as a plain object, or undefined for null, arrays, and primitives. */
function asRecord(body: unknown): Record<string, unknown> | undefined {
	return typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : undefined;
}

function copy(request: EnrollmentRequest): EnrollmentRequest {
	return { ...request, statusHistory: request.statusHistory.map((entry) => ({ ...entry })) };
}

function validateCreate(body: Record<string, unknown>): QueryParameterError[] {
	const { courseId, learnerEmail, justification } = body;
	const errors: QueryParameterError[] = [];
	if (typeof courseId !== 'string' || courseId === '') {
		errors.push({ field: 'courseId', message: 'courseId must be a non-empty string.' });
	}
	if (typeof learnerEmail !== 'string' || !EMAIL.test(learnerEmail)) {
		errors.push({ field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' });
	}
	const length = typeof justification === 'string' ? justification.trim().length : 0;
	if (length < 20 || length > 500) {
		errors.push({ field: 'justification', message: 'justification must be between 20 and 500 characters.' });
	}
	return errors;
}

function validateStatusChange(body: Record<string, unknown>): QueryParameterError[] {
	const { status, changedBy, reason } = body;
	const errors: QueryParameterError[] = [];
	if (typeof status !== 'string' || !STATUSES.includes(status)) {
		errors.push(STATUS_DETAIL);
	}
	if (typeof changedBy !== 'string' || changedBy === '') {
		errors.push({ field: 'changedBy', message: 'changedBy must be a non-empty string.' });
	}
	const reasonInvalid = status === 'rejected' ? typeof reason !== 'string' || reason.trim() === '' : reason !== undefined && typeof reason !== 'string';
	if (reasonInvalid) {
		errors.push({ field: 'reason', message: 'reason must be a string, and is required when status is rejected.' });
	}
	return errors;
}

export function createEnrollmentRequestService(courses: readonly Course[], options: { now?: () => string } = {}): EnrollmentRequestService {
	const now = options.now ?? (() => new Date().toISOString());
	// shortcut: in-memory store per service instance, lost on restart; upgrade when a persistence layer exists.
	const store: EnrollmentRequest[] = [];
	const notFound = <T>(): EnrollmentResult<T> => fail('ENROLLMENT_REQUEST_NOT_FOUND', 'The enrollment request does not exist.');

	return {
		create(body: unknown): EnrollmentResult<EnrollmentRequest> {
			const record = asRecord(body);
			if (record === undefined) {
				return invalid([BODY_DETAIL]);
			}
			const errors = validateCreate(record);
			if (errors.length > 0) {
				return invalid(errors);
			}
			const { courseId, learnerEmail, justification } = record as Pick<EnrollmentRequest, 'courseId' | 'learnerEmail' | 'justification'>;
			const course = courses.find((c) => c.id === courseId);
			if (course === undefined) {
				return fail('COURSE_NOT_FOUND', 'The course does not exist.');
			}
			if (course.status !== 'active') {
				return fail('COURSE_NOT_ACTIVE', 'The course is not open for enrollment.');
			}
			const email = learnerEmail.toLowerCase();
			if (store.some((r) => r.courseId === courseId && r.learnerEmail.toLowerCase() === email && (r.status === 'pending' || r.status === 'approved'))) {
				return fail('DUPLICATE_ACTIVE_REQUEST', 'The learner already has a pending or approved request for this course.');
			}
			const at = now();
			const request: EnrollmentRequest = {
				id: `enroll-${String(store.length + 1).padStart(3, '0')}`,
				courseId,
				learnerEmail,
				justification,
				status: 'pending',
				createdAt: at,
				updatedAt: at,
				statusHistory: [{ fromStatus: null, toStatus: 'pending', changedAt: at, changedBy: 'system', reason: null }],
			};
			store.push(request);
			return { ok: true, value: copy(request) };
		},

		get(id: string): EnrollmentResult<EnrollmentRequest> {
			const request = store.find((r) => r.id === id);
			return request === undefined ? notFound() : { ok: true, value: copy(request) };
		},

		list(params: EnrollmentListParams): EnrollmentResult<EnrollmentRequest[]> {
			const { status, courseId } = params;
			if (status !== undefined && !STATUSES.includes(status)) {
				return invalid([STATUS_DETAIL]);
			}
			const email = params.learnerEmail?.toLowerCase();
			const matches = store.filter((r) => (status === undefined || r.status === status) && (courseId === undefined || r.courseId === courseId) && (email === undefined || r.learnerEmail.toLowerCase() === email));
			return { ok: true, value: matches.map(copy) };
		},

		updateStatus(id: string, body: unknown): EnrollmentResult<EnrollmentRequest> {
			const record = asRecord(body);
			if (record === undefined) {
				return invalid([BODY_DETAIL]);
			}
			const errors = validateStatusChange(record);
			if (errors.length > 0) {
				return invalid(errors);
			}
			const { status, changedBy, reason } = record as { status: EnrollmentRequestStatus; changedBy: string; reason?: string };
			const request = store.find((r) => r.id === id);
			if (request === undefined) {
				return notFound();
			}
			if (!ALLOWED_TRANSITIONS.includes(`${request.status}->${status}`)) {
				return fail('INVALID_STATUS_TRANSITION', `An enrollment request cannot move from ${request.status} to ${status}.`);
			}
			const at = now();
			request.statusHistory.push({ fromStatus: request.status, toStatus: status, changedAt: at, changedBy, reason: reason ?? null });
			request.status = status;
			request.updatedAt = at;
			return { ok: true, value: copy(request) };
		},
	};
}
