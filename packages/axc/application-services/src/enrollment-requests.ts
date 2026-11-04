import { type CourseRepository, type EnrollmentRequest, type EnrollmentRequestRepository, type EnrollmentStatus, enrollmentStatuses, type StatusHistoryEntry } from '@axc/domain';
import { ApplicationError, type ErrorDetail, isOneOf } from './errors.ts';

const REQUEST_MESSAGE = 'The request could not be completed.';
// shortcut: obvious malformed addresses only, upgrade when a shared email parser exists
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const transitions: Record<EnrollmentStatus, readonly EnrollmentStatus[]> = {
	pending: ['approved', 'rejected', 'cancelled'],
	approved: ['cancelled'],
	rejected: [],
	cancelled: [],
};

export async function createEnrollmentRequest(courses: CourseRepository, requests: EnrollmentRequestRepository, now: () => string, createId: () => string, input: unknown): Promise<EnrollmentRequest> {
	const body = readObject(input);
	const details: ErrorDetail[] = [];
	const courseId = readString(body.courseId);
	const learnerEmail = readString(body.learnerEmail);
	const justification = readString(body.justification);
	if (courseId === undefined || courseId.trim() === '') {
		details.push({ field: 'courseId', message: 'courseId is required.' });
	}
	if (learnerEmail === undefined || !emailPattern.test(learnerEmail)) {
		details.push({ field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' });
	}
	if (justification === undefined || justification.length < 20 || justification.length > 500) {
		details.push({ field: 'justification', message: 'justification must be between 20 and 500 characters.' });
	}
	if (details.length > 0 || courseId === undefined || learnerEmail === undefined || justification === undefined) {
		throw new ApplicationError('INVALID_REQUEST', REQUEST_MESSAGE, details);
	}

	const course = await courses.getById(courseId);
	if (course === undefined) {
		throw new ApplicationError('COURSE_NOT_FOUND', 'Course not found.', [{ field: 'courseId', message: 'Course not found.' }]);
	}
	if (course.status !== 'active') {
		throw new ApplicationError('COURSE_NOT_ACTIVE', 'Course is not active.', [{ field: 'courseId', message: 'Course is not active.' }]);
	}

	const duplicate = (await requests.list()).some((request) => request.courseId === courseId && request.learnerEmail.toLowerCase() === learnerEmail.toLowerCase() && (request.status === 'pending' || request.status === 'approved'));
	if (duplicate) {
		throw new ApplicationError('DUPLICATE_ACTIVE_REQUEST', 'An active enrollment request already exists for this learner and course.', [
			{ field: 'learnerEmail', message: 'An active enrollment request already exists for this learner and course.' },
		]);
	}

	const timestamp = now();
	const request: EnrollmentRequest = {
		id: createId(),
		courseId,
		learnerEmail,
		justification,
		status: 'pending',
		createdAt: timestamp,
		updatedAt: timestamp,
		statusHistory: [historyEntry(null, 'pending', timestamp, 'system', null)],
	};
	await requests.add(request);
	return request;
}

export function getEnrollmentRequest(requests: EnrollmentRequestRepository, id: string): Promise<EnrollmentRequest> {
	return requireRequest(requests, id);
}

export async function listEnrollmentRequests(requests: EnrollmentRequestRepository, query: Readonly<Record<string, string | undefined>>): Promise<{ items: EnrollmentRequest[] }> {
	const status = readString(query.status);
	if (status !== undefined && !isOneOf(enrollmentStatuses, status)) {
		throw new ApplicationError('INVALID_REQUEST', REQUEST_MESSAGE, [{ field: 'status', message: 'status must be pending, approved, rejected, or cancelled.' }]);
	}
	const courseId = normalizeOptional(query.courseId);
	const learnerEmail = normalizeOptional(query.learnerEmail)?.toLowerCase();
	const items = (await requests.list())
		.filter((request) => {
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
		})
		.sort((left, right) => left.createdAt.localeCompare(right.createdAt, 'en') || left.id.localeCompare(right.id, 'en'));
	return { items };
}

export async function updateEnrollmentRequestStatus(requests: EnrollmentRequestRepository, now: () => string, id: string, input: unknown): Promise<EnrollmentRequest> {
	const body = readObject(input);
	const details: ErrorDetail[] = [];
	const status = readString(body.status);
	const changedBy = readString(body.changedBy);
	const reason = readString(body.reason);
	if (status === undefined || !isOneOf(enrollmentStatuses, status)) {
		details.push({ field: 'status', message: 'status must be pending, approved, rejected, or cancelled.' });
	}
	if (changedBy === undefined || changedBy.trim() === '') {
		details.push({ field: 'changedBy', message: 'changedBy is required.' });
	}
	if (status === 'rejected' && (reason === undefined || reason.trim() === '')) {
		details.push({ field: 'reason', message: 'reason is required when rejecting a request.' });
	}
	if (details.length > 0 || status === undefined || !isOneOf(enrollmentStatuses, status) || changedBy === undefined) {
		throw new ApplicationError('INVALID_REQUEST', REQUEST_MESSAGE, details);
	}

	const current = await requireRequest(requests, id);
	if (!transitions[current.status].some((allowed) => allowed === status)) {
		throw new ApplicationError('INVALID_STATUS_TRANSITION', 'The status transition is not allowed.', [{ field: 'status', message: `Cannot change status from ${current.status} to ${status}.` }]);
	}

	const changedAt = now();
	const updated: EnrollmentRequest = {
		...current,
		status,
		updatedAt: changedAt,
		statusHistory: [...current.statusHistory, historyEntry(current.status, status, changedAt, changedBy.trim(), blankToNull(reason))],
	};
	await requests.save(updated);
	return updated;
}

async function requireRequest(requests: EnrollmentRequestRepository, id: string): Promise<EnrollmentRequest> {
	const request = await requests.getById(id);
	if (request === undefined) {
		throw new ApplicationError('ENROLLMENT_REQUEST_NOT_FOUND', 'Enrollment request not found.', [{ field: 'id', message: 'Enrollment request not found.' }]);
	}
	return request;
}

function historyEntry(fromStatus: EnrollmentStatus | null, toStatus: EnrollmentStatus, changedAt: string, changedBy: string, reason: string | null): StatusHistoryEntry {
	return { fromStatus, toStatus, changedAt, changedBy, reason };
}

function readObject(input: unknown): Record<string, unknown> {
	if (input === null || typeof input !== 'object' || Array.isArray(input)) {
		return {};
	}
	return input as Record<string, unknown>;
}

function readString(value: unknown): string | undefined {
	return typeof value === 'string' ? value : undefined;
}

function normalizeOptional(value: string | undefined): string | undefined {
	if (value === undefined || value === '') {
		return undefined;
	}
	return value;
}

function blankToNull(value: string | undefined): string | null {
	if (value === undefined || value.trim() === '') {
		return null;
	}
	return value.trim();
}
