import {
	type CourseCatalog,
	ENROLLMENT_REQUEST_STATUSES,
	type EnrollmentRequest,
	type EnrollmentRequestStatus,
	type EnrollmentRequestStore,
	EnrollmentStatusTransitionError,
	isJustificationLength,
	isLearnerEmail,
	JUSTIFICATION_MAX_LENGTH,
	JUSTIFICATION_MIN_LENGTH,
	learnerEmailsMatch,
} from '@axc/domain';

const INVALID_REQUEST = 'INVALID_REQUEST' as const;
const COURSE_NOT_FOUND = 'COURSE_NOT_FOUND' as const;
const COURSE_NOT_ACTIVE = 'COURSE_NOT_ACTIVE' as const;
const DUPLICATE_ACTIVE_REQUEST = 'DUPLICATE_ACTIVE_REQUEST' as const;
const ENROLLMENT_REQUEST_NOT_FOUND = 'ENROLLMENT_REQUEST_NOT_FOUND' as const;
const INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION' as const;
const INVALID_REQUEST_MESSAGE = 'The request could not be completed.' as const;

const CREATE_FIELDS = ['courseId', 'learnerEmail', 'justification'] as const;
const STATUS_FIELDS = ['status', 'changedBy', 'reason'] as const;
const LIST_FIELDS = ['status', 'courseId', 'learnerEmail'] as const;

export type RawEnrollmentQuery = Readonly<Record<string, readonly string[] | undefined>>;

export interface EnrollmentFieldError {
	readonly field: string;
	readonly message: string;
}

export interface StatusHistoryEntryDto {
	readonly fromStatus: EnrollmentRequestStatus | null;
	readonly toStatus: EnrollmentRequestStatus;
	readonly changedAt: string;
	readonly changedBy: string;
	readonly reason: string | null;
}

export interface EnrollmentRequestDto {
	readonly id: string;
	readonly courseId: string;
	readonly learnerEmail: string;
	readonly justification: string;
	readonly status: EnrollmentRequestStatus;
	readonly createdAt: string;
	readonly updatedAt: string;
	readonly statusHistory: readonly StatusHistoryEntryDto[];
}

export interface EnrollmentRequestListDto {
	readonly items: readonly EnrollmentRequestDto[];
}

export type EnrollmentErrorCode = typeof INVALID_REQUEST | typeof COURSE_NOT_FOUND | typeof COURSE_NOT_ACTIVE | typeof DUPLICATE_ACTIVE_REQUEST | typeof ENROLLMENT_REQUEST_NOT_FOUND | typeof INVALID_STATUS_TRANSITION;

export interface EnrollmentErrorBody {
	readonly error: {
		readonly code: EnrollmentErrorCode;
		readonly message: string;
		readonly details: readonly EnrollmentFieldError[];
	};
}

export type EnrollmentCommandResult = { readonly ok: true; readonly status: 200 | 201; readonly body: EnrollmentRequestDto } | { readonly ok: false; readonly status: 400 | 404 | 409; readonly body: EnrollmentErrorBody };

export type EnrollmentListResult = { readonly ok: true; readonly status: 200; readonly body: EnrollmentRequestListDto } | { readonly ok: false; readonly status: 400; readonly body: EnrollmentErrorBody };

export interface EnrollmentRequestService {
	create(body: unknown): Promise<EnrollmentCommandResult>;
	getById(id: string): Promise<EnrollmentCommandResult>;
	list(rawQuery: RawEnrollmentQuery): Promise<EnrollmentListResult>;
	updateStatus(id: string, body: unknown): Promise<EnrollmentCommandResult>;
}

interface EnrollmentRequestServiceDependencies {
	readonly catalog: CourseCatalog;
	readonly store: EnrollmentRequestStore;
	readonly now?: () => string;
}

interface CreateInput {
	readonly courseId: string;
	readonly learnerEmail: string;
	readonly justification: string;
}

interface StatusInput {
	readonly status: EnrollmentRequestStatus;
	readonly changedBy: string;
	readonly reason: string | null;
}

interface ListQuery {
	readonly status?: EnrollmentRequestStatus;
	readonly courseId?: string;
	readonly learnerEmail?: string;
}

export function createEnrollmentRequestService(dependencies: EnrollmentRequestServiceDependencies): EnrollmentRequestService {
	const now = dependencies.now ?? (() => new Date().toISOString());

	return {
		create(body: unknown) {
			return createRequest(dependencies.catalog, dependencies.store, now, body);
		},
		getById(id: string) {
			return dependencies.store.findById(id).then((request) => {
				if (request === undefined) {
					return requestNotFound();
				}
				return { ok: true as const, status: 200 as const, body: toDto(request) };
			});
		},
		list(rawQuery: RawEnrollmentQuery) {
			const parsed = parseListQuery(rawQuery);
			if (!parsed.ok) {
				return Promise.resolve({ ok: false as const, status: 400 as const, body: invalidRequestBody(parsed.details) });
			}
			return dependencies.store.list().then((requests) => ({
				ok: true as const,
				status: 200 as const,
				body: { items: filterRequests(requests, parsed.query).map(toDto) },
			}));
		},
		updateStatus(id: string, body: unknown) {
			return updateRequestStatus(dependencies.store, now, id, body);
		},
	};
}

async function createRequest(catalog: CourseCatalog, store: EnrollmentRequestStore, now: () => string, body: unknown): Promise<EnrollmentCommandResult> {
	const parsed = parseCreateBody(body);
	if (!parsed.ok) {
		return { ok: false, status: 400, body: invalidRequestBody(parsed.details) };
	}
	const course = (await catalog.listCourses()).find((candidate) => candidate.id === parsed.value.courseId);
	if (course === undefined) {
		return {
			ok: false,
			status: 404,
			body: errorBody(COURSE_NOT_FOUND, 'The course does not exist.', [{ field: 'courseId', message: 'No course exists with this id.' }]),
		};
	}
	if (course.status !== 'active') {
		return {
			ok: false,
			status: 409,
			body: errorBody(COURSE_NOT_ACTIVE, 'Enrollment requests can only be created for an active course.', [{ field: 'courseId', message: `The course status is ${course.status}.` }]),
		};
	}
	const added = await store.add({
		courseId: parsed.value.courseId,
		learnerEmail: parsed.value.learnerEmail,
		justification: parsed.value.justification,
		createdAt: now(),
	});
	if (!added.added) {
		return {
			ok: false,
			status: 409,
			body: errorBody(DUPLICATE_ACTIVE_REQUEST, 'This learner already has a pending or approved request for the course.', [
				{ field: 'learnerEmail', message: 'A pending or approved request already exists for this learner and course.' },
			]),
		};
	}
	return { ok: true, status: 201, body: toDto(added.request) };
}

async function updateRequestStatus(store: EnrollmentRequestStore, now: () => string, id: string, body: unknown): Promise<EnrollmentCommandResult> {
	const parsed = parseStatusBody(body);
	if (!parsed.ok) {
		return { ok: false, status: 400, body: invalidRequestBody(parsed.details) };
	}
	const changedAt = now();
	try {
		const updated = await store.update(id, (current) =>
			current.transition({
				toStatus: parsed.value.status,
				changedBy: parsed.value.changedBy,
				changedAt,
				reason: parsed.value.reason,
			}),
		);
		if (updated === undefined) {
			return requestNotFound();
		}
		return { ok: true, status: 200, body: toDto(updated) };
	} catch (error) {
		if (error instanceof EnrollmentStatusTransitionError) {
			return {
				ok: false,
				status: 409,
				body: errorBody(INVALID_STATUS_TRANSITION, 'The enrollment request cannot change to the requested status.', [{ field: 'status', message: `${error.fromStatus} cannot change to ${error.toStatus}.` }]),
			};
		}
		throw error;
	}
}

function parseCreateBody(body: unknown): { ok: true; value: CreateInput } | { ok: false; details: EnrollmentFieldError[] } {
	if (!isRecord(body)) {
		return { ok: false, details: [{ field: 'body', message: 'Request body must be a JSON object.' }] };
	}
	const details: EnrollmentFieldError[] = [];
	const courseId = readRequiredString(body, 'courseId', 'courseId is required.', details);
	const learnerEmail = readLearnerEmail(body, details);
	const justification = readJustification(body, details);
	pushUnknownFields(body, CREATE_FIELDS, details);
	if (details.length > 0 || courseId === undefined || learnerEmail === undefined || justification === undefined) {
		return { ok: false, details };
	}
	return { ok: true, value: { courseId, learnerEmail, justification } };
}

function parseStatusBody(body: unknown): { ok: true; value: StatusInput } | { ok: false; details: EnrollmentFieldError[] } {
	if (!isRecord(body)) {
		return { ok: false, details: [{ field: 'body', message: 'Request body must be a JSON object.' }] };
	}
	const details: EnrollmentFieldError[] = [];
	const status = readStatus(body, details);
	const changedBy = readRequiredString(body, 'changedBy', 'changedBy must be a non-empty string.', details);
	const reason = readReason(body, status, details);
	pushUnknownFields(body, STATUS_FIELDS, details);
	if (details.length > 0 || status === undefined || changedBy === undefined || reason === undefined) {
		return { ok: false, details };
	}
	return { ok: true, value: { status, changedBy, reason } };
}

function parseListQuery(rawQuery: RawEnrollmentQuery): { ok: true; query: ListQuery } | { ok: false; details: EnrollmentFieldError[] } {
	const details: EnrollmentFieldError[] = [];
	const status = readQueryMember(rawQuery, 'status', ENROLLMENT_REQUEST_STATUSES, `status must be one of ${ENROLLMENT_REQUEST_STATUSES.join(', ')}.`, details);
	const courseId = readQueryText(rawQuery, 'courseId', 'courseId must be a non-empty string.', details);
	const learnerEmail = readQueryText(rawQuery, 'learnerEmail', 'learnerEmail must be a non-empty string.', details);
	for (const field of Object.keys(rawQuery).sort()) {
		if (!isListedField(field)) {
			details.push({ field, message: `${field} is not a supported query parameter.` });
		}
	}
	if (details.length > 0) {
		return { ok: false, details };
	}
	const query: { status?: EnrollmentRequestStatus; courseId?: string; learnerEmail?: string } = {};
	if (status !== undefined) {
		query.status = status;
	}
	if (courseId !== undefined) {
		query.courseId = courseId;
	}
	if (learnerEmail !== undefined) {
		query.learnerEmail = learnerEmail;
	}
	return { ok: true, query };
}

function filterRequests(requests: readonly EnrollmentRequest[], query: ListQuery): readonly EnrollmentRequest[] {
	return [...requests].filter((request) => matchesListQuery(request, query)).sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id));
}

function matchesListQuery(request: EnrollmentRequest, query: ListQuery): boolean {
	if (query.status !== undefined && request.status !== query.status) {
		return false;
	}
	if (query.courseId !== undefined && request.courseId !== query.courseId) {
		return false;
	}
	if (query.learnerEmail !== undefined && !learnerEmailsMatch(request.learnerEmail, query.learnerEmail)) {
		return false;
	}
	return true;
}

function readLearnerEmail(body: Readonly<Record<string, unknown>>, details: EnrollmentFieldError[]): string | undefined {
	const value = readRequiredString(body, 'learnerEmail', 'learnerEmail must be a valid email address.', details);
	if (value === undefined) {
		return undefined;
	}
	if (!isLearnerEmail(value)) {
		details.push({ field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' });
		return undefined;
	}
	return value;
}

function readJustification(body: Readonly<Record<string, unknown>>, details: EnrollmentFieldError[]): string | undefined {
	const field = 'justification';
	const value = body[field];
	if (typeof value !== 'string' || !isJustificationLength(value)) {
		details.push({ field, message: `justification must be between ${JUSTIFICATION_MIN_LENGTH} and ${JUSTIFICATION_MAX_LENGTH} characters.` });
		return undefined;
	}
	return value;
}

function readStatus(body: Readonly<Record<string, unknown>>, details: EnrollmentFieldError[]): EnrollmentRequestStatus | undefined {
	const field = 'status';
	const value = body[field];
	if (typeof value !== 'string' || !isEnrollmentStatus(value)) {
		details.push({ field, message: `status must be one of ${ENROLLMENT_REQUEST_STATUSES.join(', ')}.` });
		return undefined;
	}
	return value;
}

function readReason(body: Readonly<Record<string, unknown>>, status: EnrollmentRequestStatus | undefined, details: EnrollmentFieldError[]): string | null | undefined {
	const field = 'reason';
	if (!(field in body) || body[field] === null) {
		if (status === 'rejected') {
			details.push({ field, message: 'reason is required when status is rejected.' });
			return undefined;
		}
		return null;
	}
	const value = body[field];
	if (typeof value !== 'string') {
		details.push({ field, message: 'reason must be a string.' });
		return undefined;
	}
	if (value.trim() === '') {
		if (status === 'rejected') {
			details.push({ field, message: 'reason is required when status is rejected.' });
			return undefined;
		}
		return null;
	}
	return value.trim();
}

function readRequiredString(body: Readonly<Record<string, unknown>>, field: string, message: string, details: EnrollmentFieldError[]): string | undefined {
	const value = body[field];
	if (typeof value !== 'string' || value.trim() === '') {
		details.push({ field, message });
		return undefined;
	}
	return value.trim();
}

function pushUnknownFields(body: Readonly<Record<string, unknown>>, allowed: readonly string[], details: EnrollmentFieldError[]): void {
	for (const field of Object.keys(body).sort()) {
		if (!allowed.some((candidate) => candidate === field)) {
			details.push({ field, message: `${field} is not a supported field.` });
		}
	}
}

function readQueryText(rawQuery: RawEnrollmentQuery, field: string, message: string, details: EnrollmentFieldError[]): string | undefined {
	const value = readSingle(rawQuery, field, details);
	if (value === undefined) {
		return undefined;
	}
	if (value === '') {
		details.push({ field, message });
		return undefined;
	}
	return value;
}

function readQueryMember<T extends string>(rawQuery: RawEnrollmentQuery, field: string, allowed: readonly T[], message: string, details: EnrollmentFieldError[]): T | undefined {
	const value = readSingle(rawQuery, field, details);
	if (value === undefined) {
		return undefined;
	}
	if (value === '' || !isMember(allowed, value)) {
		details.push({ field, message });
		return undefined;
	}
	return value;
}

function readSingle(rawQuery: RawEnrollmentQuery, field: string, details: EnrollmentFieldError[]): string | undefined {
	const values = rawQuery[field];
	if (values === undefined || values.length === 0) {
		return undefined;
	}
	if (values.length > 1) {
		details.push({ field, message: `${field} must be provided once.` });
		return undefined;
	}
	const value = values[0];
	if (value === undefined) {
		return undefined;
	}
	return value.trim();
}

function toDto(request: EnrollmentRequest): EnrollmentRequestDto {
	return {
		id: request.id,
		courseId: request.courseId,
		learnerEmail: request.learnerEmail,
		justification: request.justification,
		status: request.status,
		createdAt: request.createdAt,
		updatedAt: request.updatedAt,
		statusHistory: request.statusHistory.map((entry) => ({
			fromStatus: entry.fromStatus,
			toStatus: entry.toStatus,
			changedAt: entry.changedAt,
			changedBy: entry.changedBy,
			reason: entry.reason,
		})),
	};
}

function requestNotFound(): EnrollmentCommandResult {
	return {
		ok: false,
		status: 404,
		body: errorBody(ENROLLMENT_REQUEST_NOT_FOUND, 'The enrollment request does not exist.', [{ field: 'id', message: 'No enrollment request exists with this id.' }]),
	};
}

function invalidRequestBody(details: readonly EnrollmentFieldError[]): EnrollmentErrorBody {
	return errorBody(INVALID_REQUEST, INVALID_REQUEST_MESSAGE, details);
}

function errorBody(code: EnrollmentErrorCode, message: string, details: readonly EnrollmentFieldError[]): EnrollmentErrorBody {
	return { error: { code, message, details } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEnrollmentStatus(value: string): value is EnrollmentRequestStatus {
	return isMember(ENROLLMENT_REQUEST_STATUSES, value);
}

function isListedField(field: string): field is (typeof LIST_FIELDS)[number] {
	return isMember(LIST_FIELDS, field);
}

function isMember<T extends string>(values: readonly T[], value: string): value is T {
	return values.some((candidate) => candidate === value);
}
