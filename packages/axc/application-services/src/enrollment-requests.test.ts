import { describe, expect, it } from 'vitest';
import { COURSE_SEED } from './course-seed.ts';
import { createEnrollmentRequestService, type EnrollmentError, type EnrollmentRequestService, type EnrollmentResult } from './enrollment-requests.ts';

// Seed ids (see course-seed.ts): course-001/002/003 active, course-004 draft, course-005 retired.
const ACTIVE = 'course-001';
const OTHER_ACTIVE = 'course-002';
const DRAFT = 'course-004';
const RETIRED = 'course-005';

const T0 = '2026-06-27T10:00:00.000Z';
const T1 = '2026-06-28T09:30:00.000Z';
const T2 = '2026-06-29T08:00:00.000Z';

const JUSTIFICATION = 'I need this course to prepare for upcoming secure development work.';
const validBody = (overrides: Record<string, unknown> = {}) => ({ courseId: ACTIVE, learnerEmail: 'learner@example.org', justification: JUSTIFICATION, ...overrides });

/** A service whose clock returns each given time in turn, then repeats the last one. */
function serviceWithClock(...times: string[]): EnrollmentRequestService {
	let call = 0;
	const now = () => times[Math.min(call++, times.length - 1)] ?? T0;
	return createEnrollmentRequestService(COURSE_SEED, { now });
}

function ok<T>(result: EnrollmentResult<T>): T {
	if (!result.ok) {
		throw new Error(`expected ok, got error ${JSON.stringify(result.error)}`);
	}
	return result.value;
}

function err<T>(result: EnrollmentResult<T>): EnrollmentError {
	if (result.ok) {
		throw new Error(`expected error, got ok ${JSON.stringify(result.value)}`);
	}
	return result.error;
}

const INVALID_MESSAGE = 'The request could not be completed.';
const fields = (error: EnrollmentError) => error.details.map((detail) => detail.field).sort();

describe('create', () => {
	it('creates a pending request matching the API contract example', () => {
		const service = serviceWithClock(T0);

		expect(ok(service.create(validBody()))).toEqual({
			id: 'enroll-001',
			courseId: ACTIVE,
			learnerEmail: 'learner@example.org',
			justification: JUSTIFICATION,
			status: 'pending',
			createdAt: T0,
			updatedAt: T0,
			statusHistory: [{ fromStatus: null, toStatus: 'pending', changedAt: T0, changedBy: 'system', reason: null }],
		});
	});

	it('assigns sequential ids enroll-001, enroll-002, enroll-003', () => {
		const service = serviceWithClock(T0);

		const ids = [ACTIVE, OTHER_ACTIVE, 'course-003'].map((courseId) => ok(service.create(validBody({ courseId }))).id);

		expect(ids).toEqual(['enroll-001', 'enroll-002', 'enroll-003']);
	});

	it('stores the learner email as submitted', () => {
		const service = serviceWithClock(T0);

		expect(ok(service.create(validBody({ learnerEmail: 'Learner@Example.org' }))).learnerEmail).toBe('Learner@Example.org');
	});

	it('makes the new request retrievable by id', () => {
		const service = serviceWithClock(T0);
		const created = ok(service.create(validBody()));

		expect(ok(service.get(created.id))).toEqual(created);
	});
});

describe('create validation', () => {
	it.each([
		['undefined', undefined],
		['null', null],
		['a string', 'not an object'],
		['a number', 42],
		['an array', [validBody()]],
	])('rejects a body that is %s with 400 INVALID_REQUEST', (_label, body) => {
		const error = err(serviceWithClock(T0).create(body));

		expect(error.code).toBe('INVALID_REQUEST');
		expect(error.message).toBe(INVALID_MESSAGE);
	});

	it.each(['courseId', 'learnerEmail', 'justification'])('rejects a missing %s with a detail for that field', (field) => {
		const body: Record<string, unknown> = validBody();
		delete body[field];

		const error = err(serviceWithClock(T0).create(body));

		expect(error.code).toBe('INVALID_REQUEST');
		expect(error.message).toBe(INVALID_MESSAGE);
		expect(fields(error)).toEqual([field]);
	});

	it.each(['courseId', 'learnerEmail', 'justification'])('rejects a non-string %s', (field) => {
		const error = err(serviceWithClock(T0).create(validBody({ [field]: 123 })));

		expect(error.code).toBe('INVALID_REQUEST');
		expect(fields(error)).toEqual([field]);
	});

	it('rejects an empty courseId', () => {
		const error = err(serviceWithClock(T0).create(validBody({ courseId: '' })));

		expect(error.code).toBe('INVALID_REQUEST');
		expect(fields(error)).toEqual(['courseId']);
	});

	it.each(['not-an-email', 'learner@', '@example.org', 'learner@example', 'learner @example.org', ''])('rejects the invalid email %j', (learnerEmail) => {
		const error = err(serviceWithClock(T0).create(validBody({ learnerEmail })));

		expect(error.code).toBe('INVALID_REQUEST');
		expect(fields(error)).toEqual(['learnerEmail']);
	});

	it('rejects a 19-character justification with the documented detail message', () => {
		const error = err(serviceWithClock(T0).create(validBody({ justification: 'x'.repeat(19) })));

		expect(error).toEqual({
			code: 'INVALID_REQUEST',
			message: INVALID_MESSAGE,
			details: [{ field: 'justification', message: 'justification must be between 20 and 500 characters.' }],
		});
	});

	it('accepts a justification of exactly 20 characters', () => {
		expect(ok(serviceWithClock(T0).create(validBody({ justification: 'x'.repeat(20) }))).status).toBe('pending');
	});

	it('accepts a justification of exactly 500 characters', () => {
		expect(ok(serviceWithClock(T0).create(validBody({ justification: 'x'.repeat(500) }))).status).toBe('pending');
	});

	it('rejects a 501-character justification', () => {
		const error = err(serviceWithClock(T0).create(validBody({ justification: 'x'.repeat(501) })));

		expect(error.code).toBe('INVALID_REQUEST');
		expect(fields(error)).toEqual(['justification']);
	});

	it('measures justification after trimming, so 19 characters padded with spaces is rejected', () => {
		const error = err(serviceWithClock(T0).create(validBody({ justification: `   ${'x'.repeat(19)}   ` })));

		expect(error.code).toBe('INVALID_REQUEST');
		expect(fields(error)).toEqual(['justification']);
	});

	it('measures justification after trimming, so 500 characters padded with spaces is accepted', () => {
		expect(ok(serviceWithClock(T0).create(validBody({ justification: `  ${'x'.repeat(500)}  ` }))).status).toBe('pending');
	});

	it('returns one detail per invalid field', () => {
		const error = err(serviceWithClock(T0).create({ courseId: '', learnerEmail: 'bad', justification: 'short' }));

		expect(error.code).toBe('INVALID_REQUEST');
		expect(fields(error)).toEqual(['courseId', 'justification', 'learnerEmail']);
	});

	it('validates before checking the course, so an invalid body for a missing course is a 400', () => {
		const error = err(serviceWithClock(T0).create(validBody({ courseId: 'course-999', learnerEmail: 'bad' })));

		expect(error.code).toBe('INVALID_REQUEST');
	});

	it('validates before checking duplicates', () => {
		const service = serviceWithClock(T0);
		ok(service.create(validBody()));

		expect(err(service.create(validBody({ justification: 'short' }))).code).toBe('INVALID_REQUEST');
	});

	it('does not store a rejected request', () => {
		const service = serviceWithClock(T0);
		err(service.create(validBody({ learnerEmail: 'bad' })));

		expect(ok(service.list({}))).toEqual([]);
	});
});

describe('create course checks', () => {
	it('returns COURSE_NOT_FOUND with empty details for an unknown course', () => {
		const error = err(serviceWithClock(T0).create(validBody({ courseId: 'course-999' })));

		expect(error.code).toBe('COURSE_NOT_FOUND');
		expect(error.details).toEqual([]);
		expect(error.message).toEqual(expect.any(String));
	});

	it.each([
		['draft', DRAFT],
		['retired', RETIRED],
	])('returns COURSE_NOT_ACTIVE with empty details for a %s course', (_status, courseId) => {
		const error = err(serviceWithClock(T0).create(validBody({ courseId })));

		expect(error.code).toBe('COURSE_NOT_ACTIVE');
		expect(error.details).toEqual([]);
	});

	it('only looks up courses in the catalog the service was created with', () => {
		const service = createEnrollmentRequestService([], { now: () => T0 });

		expect(err(service.create(validBody())).code).toBe('COURSE_NOT_FOUND');
	});
});

describe('create duplicate prevention', () => {
	it('rejects a second request while the first is pending with DUPLICATE_ACTIVE_REQUEST and empty details', () => {
		const service = serviceWithClock(T0);
		ok(service.create(validBody()));

		const error = err(service.create(validBody()));

		expect(error.code).toBe('DUPLICATE_ACTIVE_REQUEST');
		expect(error.details).toEqual([]);
	});

	it('rejects a second request while the first is approved', () => {
		const service = serviceWithClock(T0);
		const first = ok(service.create(validBody()));
		ok(service.updateStatus(first.id, { status: 'approved', changedBy: 'reviewer@example.org' }));

		expect(err(service.create(validBody())).code).toBe('DUPLICATE_ACTIVE_REQUEST');
	});

	it('compares learner emails ignoring case', () => {
		const service = serviceWithClock(T0);
		ok(service.create(validBody({ learnerEmail: 'learner@example.org' })));

		expect(err(service.create(validBody({ learnerEmail: 'LEARNER@Example.ORG' }))).code).toBe('DUPLICATE_ACTIVE_REQUEST');
	});

	it('allows a new request after the earlier one is rejected', () => {
		const service = serviceWithClock(T0);
		const first = ok(service.create(validBody()));
		ok(service.updateStatus(first.id, { status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Missing prerequisite.' }));

		expect(ok(service.create(validBody())).id).toBe('enroll-002');
	});

	it('allows a new request after the earlier one is cancelled', () => {
		const service = serviceWithClock(T0);
		const first = ok(service.create(validBody()));
		ok(service.updateStatus(first.id, { status: 'cancelled', changedBy: 'learner@example.org' }));

		expect(ok(service.create(validBody())).id).toBe('enroll-002');
	});

	it('allows the same learner to request a different course', () => {
		const service = serviceWithClock(T0);
		ok(service.create(validBody()));

		expect(ok(service.create(validBody({ courseId: OTHER_ACTIVE }))).status).toBe('pending');
	});

	it('allows a different learner to request the same course', () => {
		const service = serviceWithClock(T0);
		ok(service.create(validBody()));

		expect(ok(service.create(validBody({ learnerEmail: 'other@example.org' }))).status).toBe('pending');
	});
});

describe('get', () => {
	it('returns the request with its full status history', () => {
		const service = serviceWithClock(T0, T1);
		const created = ok(service.create(validBody()));
		ok(service.updateStatus(created.id, { status: 'approved', changedBy: 'reviewer@example.org' }));

		const fetched = ok(service.get(created.id));

		expect(fetched.status).toBe('approved');
		expect(fetched.statusHistory).toHaveLength(2);
	});

	it('returns ENROLLMENT_REQUEST_NOT_FOUND with empty details for an unknown id', () => {
		const error = err(serviceWithClock(T0).get('enroll-999'));

		expect(error.code).toBe('ENROLLMENT_REQUEST_NOT_FOUND');
		expect(error.details).toEqual([]);
		expect(error.message).toEqual(expect.any(String));
	});
});

describe('list', () => {
	// enroll-001 a@ course-001 pending, enroll-002 b@ course-001 approved, enroll-003 a@ course-002 pending, enroll-004 c@ course-002 rejected
	function seeded(): EnrollmentRequestService {
		const service = serviceWithClock(T0);
		ok(service.create(validBody({ learnerEmail: 'a@example.org', courseId: ACTIVE })));
		const b = ok(service.create(validBody({ learnerEmail: 'b@example.org', courseId: ACTIVE })));
		ok(service.create(validBody({ learnerEmail: 'a@example.org', courseId: OTHER_ACTIVE })));
		const c = ok(service.create(validBody({ learnerEmail: 'c@example.org', courseId: OTHER_ACTIVE })));
		ok(service.updateStatus(b.id, { status: 'approved', changedBy: 'reviewer@example.org' }));
		ok(service.updateStatus(c.id, { status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Missing prerequisite.' }));
		return service;
	}

	const ids = (result: EnrollmentResult<{ id: string }[]>) => ok(result).map((request) => request.id);

	it('returns an empty list when there are no requests', () => {
		expect(ok(serviceWithClock(T0).list({}))).toEqual([]);
	});

	it('returns every request in creation order when no filter is given', () => {
		expect(ids(seeded().list({}))).toEqual(['enroll-001', 'enroll-002', 'enroll-003', 'enroll-004']);
	});

	it('filters by status', () => {
		expect(ids(seeded().list({ status: 'pending' }))).toEqual(['enroll-001', 'enroll-003']);
	});

	it('filters by courseId', () => {
		expect(ids(seeded().list({ courseId: OTHER_ACTIVE }))).toEqual(['enroll-003', 'enroll-004']);
	});

	it('filters by learnerEmail ignoring case', () => {
		expect(ids(seeded().list({ learnerEmail: 'A@EXAMPLE.ORG' }))).toEqual(['enroll-001', 'enroll-003']);
	});

	it('combines filters with AND', () => {
		expect(ids(seeded().list({ status: 'pending', courseId: ACTIVE, learnerEmail: 'a@example.org' }))).toEqual(['enroll-001']);
	});

	it('returns an empty list when nothing matches', () => {
		expect(ids(seeded().list({ status: 'cancelled' }))).toEqual([]);
	});

	it('returns an empty list for an unknown courseId', () => {
		expect(ids(seeded().list({ courseId: 'course-999' }))).toEqual([]);
	});

	it('rejects an invalid status filter with INVALID_REQUEST and a status detail', () => {
		const error = err(seeded().list({ status: 'archived' }));

		expect(error.code).toBe('INVALID_REQUEST');
		expect(error.message).toBe(INVALID_MESSAGE);
		expect(fields(error)).toEqual(['status']);
	});
});

describe('updateStatus valid transitions', () => {
	it('pending -> approved updates status and updatedAt and appends a history entry with reason null', () => {
		const service = serviceWithClock(T0, T1);
		const created = ok(service.create(validBody()));

		expect(ok(service.updateStatus(created.id, { status: 'approved', changedBy: 'reviewer@example.org' }))).toEqual({
			...created,
			status: 'approved',
			createdAt: T0,
			updatedAt: T1,
			statusHistory: [
				{ fromStatus: null, toStatus: 'pending', changedAt: T0, changedBy: 'system', reason: null },
				{ fromStatus: 'pending', toStatus: 'approved', changedAt: T1, changedBy: 'reviewer@example.org', reason: null },
			],
		});
	});

	it('pending -> rejected records the reason in the history entry', () => {
		const service = serviceWithClock(T0, T1);
		const created = ok(service.create(validBody()));

		const updated = ok(service.updateStatus(created.id, { status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Learner has not completed the prerequisite course.' }));

		expect(updated.status).toBe('rejected');
		expect(updated.statusHistory.at(-1)).toEqual({
			fromStatus: 'pending',
			toStatus: 'rejected',
			changedAt: T1,
			changedBy: 'reviewer@example.org',
			reason: 'Learner has not completed the prerequisite course.',
		});
	});

	it('pending -> cancelled is allowed', () => {
		const service = serviceWithClock(T0, T1);
		const created = ok(service.create(validBody()));

		const updated = ok(service.updateStatus(created.id, { status: 'cancelled', changedBy: 'learner@example.org' }));

		expect(updated.status).toBe('cancelled');
		expect(updated.statusHistory.at(-1)).toEqual({ fromStatus: 'pending', toStatus: 'cancelled', changedAt: T1, changedBy: 'learner@example.org', reason: null });
	});

	it('approved -> cancelled is allowed and keeps an optional reason', () => {
		const service = serviceWithClock(T0, T1, T2);
		const created = ok(service.create(validBody()));
		ok(service.updateStatus(created.id, { status: 'approved', changedBy: 'reviewer@example.org' }));

		const updated = ok(service.updateStatus(created.id, { status: 'cancelled', changedBy: 'reviewer@example.org', reason: 'Course was full.' }));

		expect(updated.status).toBe('cancelled');
		expect(updated.updatedAt).toBe(T2);
		expect(updated.statusHistory.at(-1)).toEqual({ fromStatus: 'approved', toStatus: 'cancelled', changedAt: T2, changedBy: 'reviewer@example.org', reason: 'Course was full.' });
	});

	it('persists the change so get returns the updated request', () => {
		const service = serviceWithClock(T0, T1);
		const created = ok(service.create(validBody()));
		const updated = ok(service.updateStatus(created.id, { status: 'approved', changedBy: 'reviewer@example.org' }));

		expect(ok(service.get(created.id))).toEqual(updated);
	});
});

describe('updateStatus audit trail', () => {
	it('appends one history entry per change, oldest first, keeping earlier entries intact', () => {
		const service = serviceWithClock(T0, T1, T2);
		const created = ok(service.create(validBody()));
		ok(service.updateStatus(created.id, { status: 'approved', changedBy: 'reviewer@example.org' }));
		ok(service.updateStatus(created.id, { status: 'cancelled', changedBy: 'admin@example.org' }));

		expect(ok(service.get(created.id)).statusHistory).toEqual([
			{ fromStatus: null, toStatus: 'pending', changedAt: T0, changedBy: 'system', reason: null },
			{ fromStatus: 'pending', toStatus: 'approved', changedAt: T1, changedBy: 'reviewer@example.org', reason: null },
			{ fromStatus: 'approved', toStatus: 'cancelled', changedAt: T2, changedBy: 'admin@example.org', reason: null },
		]);
	});

	it('does not append a history entry for a failed change', () => {
		const service = serviceWithClock(T0, T1);
		const created = ok(service.create(validBody()));
		err(service.updateStatus(created.id, { status: 'pending', changedBy: 'reviewer@example.org' }));
		err(service.updateStatus(created.id, { status: 'rejected', changedBy: 'reviewer@example.org' }));

		expect(ok(service.get(created.id))).toEqual(created);
	});
});

describe('updateStatus invalid transitions', () => {
	function inStatus(target: 'pending' | 'approved' | 'rejected' | 'cancelled') {
		const service = serviceWithClock(T0, T1);
		const { id } = ok(service.create(validBody()));
		if (target === 'approved') ok(service.updateStatus(id, { status: 'approved', changedBy: 'r' }));
		if (target === 'rejected') ok(service.updateStatus(id, { status: 'rejected', changedBy: 'r', reason: 'Missing prerequisite.' }));
		if (target === 'cancelled') ok(service.updateStatus(id, { status: 'cancelled', changedBy: 'r' }));
		return { service, id };
	}

	it.each([
		['pending', 'pending'],
		['approved', 'pending'],
		['approved', 'approved'],
		['approved', 'rejected'],
		['rejected', 'pending'],
		['rejected', 'approved'],
		['rejected', 'rejected'],
		['rejected', 'cancelled'],
		['cancelled', 'pending'],
		['cancelled', 'approved'],
		['cancelled', 'rejected'],
		['cancelled', 'cancelled'],
	] as const)('%s -> %s returns INVALID_STATUS_TRANSITION with empty details', (from, to) => {
		const { service, id } = inStatus(from);

		const error = err(service.updateStatus(id, { status: to, changedBy: 'reviewer@example.org', reason: 'Some reason.' }));

		expect(error.code).toBe('INVALID_STATUS_TRANSITION');
		expect(error.details).toEqual([]);
		expect(ok(service.get(id)).status).toBe(from);
	});
});

describe('updateStatus validation', () => {
	it.each([
		['undefined', undefined],
		['null', null],
		['a string', 'approved'],
		['an array', [{ status: 'approved', changedBy: 'r' }]],
	])('rejects a body that is %s with INVALID_REQUEST', (_label, body) => {
		const service = serviceWithClock(T0);
		const { id } = ok(service.create(validBody()));

		const error = err(service.updateStatus(id, body));

		expect(error.code).toBe('INVALID_REQUEST');
		expect(error.message).toBe(INVALID_MESSAGE);
	});

	it.each([
		['missing', undefined],
		['unknown', 'archived'],
		['wrong case', 'Approved'],
		['not a string', 1],
	])('rejects a %s status with a status detail', (_label, status) => {
		const service = serviceWithClock(T0);
		const { id } = ok(service.create(validBody()));

		const error = err(service.updateStatus(id, { status, changedBy: 'reviewer@example.org' }));

		expect(error.code).toBe('INVALID_REQUEST');
		expect(fields(error)).toEqual(['status']);
	});

	it.each([
		['missing', undefined],
		['empty', ''],
		['not a string', 7],
	])('rejects a %s changedBy with a changedBy detail', (_label, changedBy) => {
		const service = serviceWithClock(T0);
		const { id } = ok(service.create(validBody()));

		const error = err(service.updateStatus(id, { status: 'approved', changedBy }));

		expect(error.code).toBe('INVALID_REQUEST');
		expect(fields(error)).toEqual(['changedBy']);
	});

	it.each([
		['missing', undefined],
		['null', null],
		['empty', ''],
		['blank', '   '],
	])('rejects a rejection with a %s reason with a reason detail', (_label, reason) => {
		const service = serviceWithClock(T0);
		const { id } = ok(service.create(validBody()));

		const error = err(service.updateStatus(id, { status: 'rejected', changedBy: 'reviewer@example.org', reason }));

		expect(error.code).toBe('INVALID_REQUEST');
		expect(error.message).toBe(INVALID_MESSAGE);
		expect(fields(error)).toEqual(['reason']);
	});

	it('rejects a non-string reason', () => {
		const service = serviceWithClock(T0);
		const { id } = ok(service.create(validBody()));

		const error = err(service.updateStatus(id, { status: 'approved', changedBy: 'reviewer@example.org', reason: 5 }));

		expect(error.code).toBe('INVALID_REQUEST');
		expect(fields(error)).toEqual(['reason']);
	});

	it('returns ENROLLMENT_REQUEST_NOT_FOUND with empty details for an unknown id and a valid body', () => {
		const error = err(serviceWithClock(T0).updateStatus('enroll-999', { status: 'approved', changedBy: 'reviewer@example.org' }));

		expect(error.code).toBe('ENROLLMENT_REQUEST_NOT_FOUND');
		expect(error.details).toEqual([]);
	});

	it('validates before the not-found check, so an invalid body for an unknown id is INVALID_REQUEST', () => {
		const error = err(serviceWithClock(T0).updateStatus('enroll-999', { status: 'rejected', changedBy: 'reviewer@example.org' }));

		expect(error.code).toBe('INVALID_REQUEST');
	});

	it('validates before the transition check, so rejecting a cancelled request without a reason is INVALID_REQUEST', () => {
		const service = serviceWithClock(T0);
		const { id } = ok(service.create(validBody()));
		ok(service.updateStatus(id, { status: 'cancelled', changedBy: 'r' }));

		expect(err(service.updateStatus(id, { status: 'rejected', changedBy: 'r' })).code).toBe('INVALID_REQUEST');
	});
});

describe('store isolation', () => {
	it('mutating a created request does not change the stored request', () => {
		const service = serviceWithClock(T0);
		const created = ok(service.create(validBody()));
		created.status = 'approved';
		created.statusHistory.push({ fromStatus: 'pending', toStatus: 'approved', changedAt: T1, changedBy: 'x', reason: null });

		const stored = ok(service.get('enroll-001'));
		expect(stored.status).toBe('pending');
		expect(stored.statusHistory).toHaveLength(1);
	});

	it('mutating a fetched request or its history entries does not change the stored request', () => {
		const service = serviceWithClock(T0);
		ok(service.create(validBody()));
		const fetched = ok(service.get('enroll-001'));
		fetched.learnerEmail = 'hacker@example.org';
		const entry = fetched.statusHistory[0];
		if (entry) entry.changedBy = 'hacker';

		const stored = ok(service.get('enroll-001'));
		expect(stored.learnerEmail).toBe('learner@example.org');
		expect(stored.statusHistory[0]?.changedBy).toBe('system');
	});

	it('mutating a listed request or the list does not change the store', () => {
		const service = serviceWithClock(T0);
		ok(service.create(validBody()));
		const listed = ok(service.list({}));
		const first = listed[0];
		if (first) first.status = 'cancelled';
		listed.length = 0;

		expect(ok(service.list({})).map((request) => request.status)).toEqual(['pending']);
	});

	it('mutating an updated request does not change the stored request', () => {
		const service = serviceWithClock(T0, T1);
		ok(service.create(validBody()));
		const updated = ok(service.updateStatus('enroll-001', { status: 'approved', changedBy: 'reviewer@example.org' }));
		updated.statusHistory.length = 0;

		expect(ok(service.get('enroll-001')).statusHistory).toHaveLength(2);
	});

	it('keeps separate stores and id sequences per service instance', () => {
		const first = serviceWithClock(T0);
		const second = serviceWithClock(T0);
		ok(first.create(validBody()));

		expect(ok(second.create(validBody())).id).toBe('enroll-001');
		expect(ok(second.list({}))).toHaveLength(1);
	});
});
