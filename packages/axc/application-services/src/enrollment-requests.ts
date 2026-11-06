import {
	type CourseCatalog,
	EnrollmentRequest,
	type EnrollmentRequestStatus,
	type EnrollmentRequestStore,
	enrollmentEmailsMatch,
	InvalidEnrollmentTransitionError,
	isAllowedEnrollmentTransition,
	isDuplicateActiveEnrollment,
	isEnrollmentRequestStatus,
	type StatusHistoryEntry,
} from '@axc/domain';

const invalidRequestMessage = 'The request could not be completed.';
const justificationMessage = 'justification must be between 20 and 500 characters.';
const emailMessage = 'learnerEmail must be a valid email address.';
const statusValuesMessage = 'status must be one of pending, approved, rejected, cancelled.';
const rejectionReasonMessage = 'reason is required when rejecting a request.';
const allowedQueryParameters = new Set(['status', 'courseId', 'learnerEmail']);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const maxEmailLength = 320;

export interface EnrollmentRequestDependencies {
	readonly courseCatalog: CourseCatalog;
	readonly enrollmentRequests: EnrollmentRequestStore;
	readonly now: () => string;
}

export interface EnrollmentRequestDto {
	readonly id: string;
	readonly courseId: string;
	readonly learnerEmail: string;
	readonly justification: string;
	readonly status: EnrollmentRequestStatus;
	readonly createdAt: string;
	readonly updatedAt: string;
	readonly statusHistory: readonly StatusHistoryEntry[];
}

export interface EnrollmentRequestList {
	readonly items: readonly EnrollmentRequestDto[];
}

export interface EnrollmentErrorDetail {
	readonly field: string;
	readonly message: string;
}

export type EnrollmentErrorCode = 'INVALID_REQUEST' | 'COURSE_NOT_FOUND' | 'COURSE_NOT_ACTIVE' | 'DUPLICATE_ACTIVE_REQUEST' | 'ENROLLMENT_REQUEST_NOT_FOUND' | 'INVALID_STATUS_TRANSITION';

export interface EnrollmentErrorBody {
	readonly error: {
		readonly code: EnrollmentErrorCode;
		readonly message: string;
		readonly details: readonly EnrollmentErrorDetail[];
	};
}

export type EnrollmentCommandResult = { readonly ok: true; readonly status: 200 | 201; readonly body: EnrollmentRequestDto } | { readonly ok: false; readonly status: 400 | 404 | 409; readonly body: EnrollmentErrorBody };

export type EnrollmentListResult = { readonly ok: true; readonly status: 200; readonly body: EnrollmentRequestList } | { readonly ok: false; readonly status: 400; readonly body: EnrollmentErrorBody };

export type EnrollmentQueryInput = { readonly [key: string]: string | readonly string[] | undefined };

interface CreateFields {
	readonly courseId: string;
	readonly learnerEmail: string;
	readonly justification: string;
}

interface StatusFields {
	readonly status: EnrollmentRequestStatus;
	readonly changedBy: string;
	readonly reason: string | null;
}

interface ParsedListQuery {
	readonly status?: EnrollmentRequestStatus;
	readonly courseId?: string;
	readonly learnerEmail?: string;
}

type FieldRead = { readonly state: 'absent' } | { readonly state: 'invalid' } | { readonly state: 'present'; readonly value: string };

type ParsedCreate = { readonly ok: true; readonly value: CreateFields } | { readonly ok: false; readonly error: EnrollmentErrorBody };

type ParsedStatus = { readonly ok: true; readonly value: StatusFields } | { readonly ok: false; readonly error: EnrollmentErrorBody };

type ParsedList = { readonly ok: true; readonly query: ParsedListQuery } | { readonly ok: false; readonly error: EnrollmentErrorBody };

export function unreadableEnrollmentRequestBody(): EnrollmentErrorBody {
	return invalidRequest([{ field: 'body', message: 'Request body must be a JSON object.' }]);
}

export async function createEnrollmentRequest(deps: EnrollmentRequestDependencies, body: unknown): Promise<EnrollmentCommandResult> {
	const parsed = parseCreateBody(body);
	if (!parsed.ok) {
		return { ok: false, status: 400, body: parsed.error };
	}

	const courses = await deps.courseCatalog.listCourses();
	const course = courses.find((candidate) => candidate.id === parsed.value.courseId);
	if (course === undefined) {
		return courseNotFound();
	}
	if (course.status !== 'active') {
		return courseNotActive();
	}

	const existing = await deps.enrollmentRequests.list();
	if (existing.some((candidate) => isDuplicateActiveEnrollment(candidate, parsed.value.courseId, parsed.value.learnerEmail))) {
		return duplicateActiveRequest();
	}

	const createdAt = deps.now();
	const request = EnrollmentRequest.create({
		id: deps.enrollmentRequests.nextId(),
		courseId: parsed.value.courseId,
		learnerEmail: parsed.value.learnerEmail,
		justification: parsed.value.justification,
		createdAt,
	});
	const saved = await deps.enrollmentRequests.save(request);
	if (saved === 'duplicate-active') {
		return duplicateActiveRequest();
	}
	return { ok: true, status: 201, body: toDto(request) };
}

export async function getEnrollmentRequest(deps: EnrollmentRequestDependencies, id: string): Promise<EnrollmentCommandResult> {
	const request = await deps.enrollmentRequests.findById(id);
	if (request === undefined) {
		return enrollmentRequestNotFound();
	}
	return { ok: true, status: 200, body: toDto(request) };
}

export async function listEnrollmentRequests(deps: EnrollmentRequestDependencies, input: EnrollmentQueryInput): Promise<EnrollmentListResult> {
	const parsed = parseListQuery(input);
	if (!parsed.ok) {
		return { ok: false, status: 400, body: parsed.error };
	}
	const requests = await deps.enrollmentRequests.list();
	return {
		ok: true,
		status: 200,
		body: {
			items: requests.filter((request) => matchesRequest(request, parsed.query)).map(toDto),
		},
	};
}

export async function updateEnrollmentRequestStatus(deps: EnrollmentRequestDependencies, id: string, body: unknown): Promise<EnrollmentCommandResult> {
	const parsed = parseStatusBody(body);
	if (!parsed.ok) {
		return { ok: false, status: 400, body: parsed.error };
	}

	const current = await deps.enrollmentRequests.findById(id);
	if (current === undefined) {
		return enrollmentRequestNotFound();
	}
	if (!isAllowedEnrollmentTransition(current.status, parsed.value.status)) {
		return invalidTransition(current.status, parsed.value.status);
	}

	const changedAt = deps.now();
	let updated: EnrollmentRequest;
	try {
		updated = current.withStatus({
			toStatus: parsed.value.status,
			changedAt,
			changedBy: parsed.value.changedBy,
			reason: parsed.value.reason,
		});
	} catch (error) {
		if (error instanceof InvalidEnrollmentTransitionError) {
			return invalidTransition(current.status, parsed.value.status);
		}
		throw error;
	}

	await deps.enrollmentRequests.save(updated);
	return { ok: true, status: 200, body: toDto(updated) };
}

function parseCreateBody(body: unknown): ParsedCreate {
	if (!isRecord(body)) {
		return { ok: false, error: unreadableEnrollmentRequestBody() };
	}
	const details: EnrollmentErrorDetail[] = [];
	const courseId = readRequiredText(body, 'courseId', details);
	const learnerEmail = readLearnerEmail(body, details);
	const justification = readJustification(body, details);
	if (courseId === undefined || learnerEmail === undefined || justification === undefined) {
		return { ok: false, error: invalidRequest(details) };
	}
	return { ok: true, value: { courseId, learnerEmail, justification } };
}

function parseStatusBody(body: unknown): ParsedStatus {
	if (!isRecord(body)) {
		return { ok: false, error: unreadableEnrollmentRequestBody() };
	}
	const details: EnrollmentErrorDetail[] = [];
	const status = readStatus(body, details);
	const changedBy = readChangedBy(body, details);
	const reason = readReason(body, details);
	if (status === undefined || changedBy === undefined || details.length > 0) {
		return { ok: false, error: invalidRequest(details) };
	}
	return { ok: true, value: { status, changedBy, reason } };
}

function parseListQuery(input: EnrollmentQueryInput): ParsedList {
	const details: EnrollmentErrorDetail[] = [];
	const status = readQueryStatus(input, details);
	const courseId = readQueryText(input, 'courseId', details);
	const learnerEmail = readQueryEmail(input, details);
	collectUnexpectedParameters(input, details);
	if (details.length > 0) {
		return { ok: false, error: invalidRequest(details) };
	}
	return {
		ok: true,
		query: {
			...(status === undefined ? {} : { status }),
			...(courseId === undefined ? {} : { courseId }),
			...(learnerEmail === undefined ? {} : { learnerEmail }),
		},
	};
}

function readField(body: Record<string, unknown>, field: string): unknown {
	return body[field];
}

function readRequiredText(body: Record<string, unknown>, field: string, details: EnrollmentErrorDetail[]): string | undefined {
	const value = readField(body, field);
	if (typeof value !== 'string' || value.trim().length === 0) {
		details.push({ field, message: `${field} must be a non-empty string.` });
		return undefined;
	}
	return value.trim();
}

function readLearnerEmail(body: Record<string, unknown>, details: EnrollmentErrorDetail[]): string | undefined {
	const value = readField(body, 'learnerEmail');
	if (typeof value !== 'string' || !isEmailAddress(value.trim())) {
		details.push({ field: 'learnerEmail', message: emailMessage });
		return undefined;
	}
	return value.trim();
}

function readJustification(body: Record<string, unknown>, details: EnrollmentErrorDetail[]): string | undefined {
	const value = readField(body, 'justification');
	if (typeof value !== 'string') {
		details.push({ field: 'justification', message: justificationMessage });
		return undefined;
	}
	const trimmed = value.trim();
	if (trimmed.length < 20 || trimmed.length > 500) {
		details.push({ field: 'justification', message: justificationMessage });
		return undefined;
	}
	return trimmed;
}

function readStatus(body: Record<string, unknown>, details: EnrollmentErrorDetail[]): EnrollmentRequestStatus | undefined {
	const value = readField(body, 'status');
	if (typeof value !== 'string' || value.length === 0) {
		details.push({ field: 'status', message: 'status is required.' });
		return undefined;
	}
	if (!isEnrollmentRequestStatus(value)) {
		details.push({ field: 'status', message: statusValuesMessage });
		return undefined;
	}
	return value;
}

function readChangedBy(body: Record<string, unknown>, details: EnrollmentErrorDetail[]): string | undefined {
	const value = readField(body, 'changedBy');
	if (typeof value !== 'string' || value.trim().length === 0) {
		details.push({ field: 'changedBy', message: 'changedBy is required.' });
		return undefined;
	}
	return value.trim();
}

function readReason(body: Record<string, unknown>, details: EnrollmentErrorDetail[]): string | null {
	const rejection = readField(body, 'status') === 'rejected';
	const reasonValue = readField(body, 'reason');
	if (!Object.hasOwn(body, 'reason') || reasonValue === undefined || reasonValue === null) {
		if (rejection) {
			details.push({ field: 'reason', message: rejectionReasonMessage });
		}
		return null;
	}
	if (typeof reasonValue !== 'string') {
		details.push({ field: 'reason', message: rejection ? rejectionReasonMessage : 'reason must be a string.' });
		return null;
	}
	const trimmed = reasonValue.trim();
	if (trimmed.length === 0) {
		if (rejection) {
			details.push({ field: 'reason', message: rejectionReasonMessage });
		}
		return null;
	}
	return trimmed;
}

function readQueryStatus(input: EnrollmentQueryInput, details: EnrollmentErrorDetail[]): EnrollmentRequestStatus | undefined {
	const read = readSingle(input, 'status', details);
	if (read.state !== 'present') {
		return undefined;
	}
	if (!isEnrollmentRequestStatus(read.value)) {
		details.push({ field: 'status', message: statusValuesMessage });
		return undefined;
	}
	return read.value;
}

function readQueryText(input: EnrollmentQueryInput, field: string, details: EnrollmentErrorDetail[]): string | undefined {
	const read = readSingle(input, field, details);
	if (read.state !== 'present') {
		return undefined;
	}
	const trimmed = read.value.trim();
	if (trimmed.length === 0) {
		details.push({ field, message: `${field} must be a non-empty string.` });
		return undefined;
	}
	return trimmed;
}

function readQueryEmail(input: EnrollmentQueryInput, details: EnrollmentErrorDetail[]): string | undefined {
	const read = readSingle(input, 'learnerEmail', details);
	if (read.state !== 'present') {
		return undefined;
	}
	const trimmed = read.value.trim();
	if (!isEmailAddress(trimmed)) {
		details.push({ field: 'learnerEmail', message: emailMessage });
		return undefined;
	}
	return trimmed;
}

function collectUnexpectedParameters(input: EnrollmentQueryInput, details: EnrollmentErrorDetail[]): void {
	for (const key of Object.keys(input)) {
		if (allowedQueryParameters.has(key) || !hasQueryValue(input[key])) {
			continue;
		}
		details.push({ field: key, message: 'Unexpected query parameter.' });
	}
}

function readSingle(input: EnrollmentQueryInput, field: string, details: EnrollmentErrorDetail[]): FieldRead {
	const raw = input[field];
	if (!hasQueryValue(raw) || raw === undefined) {
		return { state: 'absent' };
	}
	const values = typeof raw === 'string' ? [raw] : [...raw];
	if (values.length > 1) {
		details.push({ field, message: `${field} must be provided once.` });
		return { state: 'invalid' };
	}
	const value = values[0];
	if (value === undefined) {
		return { state: 'absent' };
	}
	return { state: 'present', value };
}

function hasQueryValue(value: string | readonly string[] | undefined): boolean {
	if (value === undefined) {
		return false;
	}
	return typeof value === 'string' ? true : value.length > 0;
}

function matchesRequest(request: EnrollmentRequest, query: ParsedListQuery): boolean {
	if (query.status !== undefined && request.status !== query.status) {
		return false;
	}
	if (query.courseId !== undefined && request.courseId !== query.courseId) {
		return false;
	}
	if (query.learnerEmail !== undefined && !enrollmentEmailsMatch(request.learnerEmail, query.learnerEmail)) {
		return false;
	}
	return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEmailAddress(value: string): boolean {
	return value.length <= maxEmailLength && emailPattern.test(value);
}

function invalidRequest(details: readonly EnrollmentErrorDetail[]): EnrollmentErrorBody {
	return {
		error: {
			code: 'INVALID_REQUEST',
			message: invalidRequestMessage,
			details,
		},
	};
}

function courseNotFound(): EnrollmentCommandResult {
	return {
		ok: false,
		status: 404,
		body: {
			error: {
				code: 'COURSE_NOT_FOUND',
				message: 'The course does not exist.',
				details: [{ field: 'courseId', message: 'No course exists with this id.' }],
			},
		},
	};
}

function courseNotActive(): EnrollmentCommandResult {
	return {
		ok: false,
		status: 409,
		body: {
			error: {
				code: 'COURSE_NOT_ACTIVE',
				message: 'The course is not active.',
				details: [{ field: 'courseId', message: 'Course status must be active.' }],
			},
		},
	};
}

function duplicateActiveRequest(): EnrollmentCommandResult {
	return {
		ok: false,
		status: 409,
		body: {
			error: {
				code: 'DUPLICATE_ACTIVE_REQUEST',
				message: 'An active enrollment request already exists for this learner and course.',
				details: [{ field: 'learnerEmail', message: 'A pending or approved request already exists for this course.' }],
			},
		},
	};
}

function enrollmentRequestNotFound(): EnrollmentCommandResult {
	return {
		ok: false,
		status: 404,
		body: {
			error: {
				code: 'ENROLLMENT_REQUEST_NOT_FOUND',
				message: 'The enrollment request does not exist.',
				details: [{ field: 'id', message: 'No enrollment request exists with this id.' }],
			},
		},
	};
}

function invalidTransition(fromStatus: EnrollmentRequestStatus, toStatus: EnrollmentRequestStatus): EnrollmentCommandResult {
	return {
		ok: false,
		status: 409,
		body: {
			error: {
				code: 'INVALID_STATUS_TRANSITION',
				message: 'The status transition is not allowed.',
				details: [{ field: 'status', message: `Cannot transition from ${fromStatus} to ${toStatus}.` }],
			},
		},
	};
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
