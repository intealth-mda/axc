import type { CatalogResult, Course, EnrollmentRequest } from '@axc/domain';
import { describe, expect, it } from 'vitest';
import { buildApplicationServicesFactory } from './index.ts';

const STAMP = '2026-06-27T10:00:00.000Z';
const JUSTIFICATION = 'I need this course to prepare for upcoming secure development work.';

function course(overrides: Partial<Course> & Pick<Course, 'id'>): Course {
	return {
		title: 'AI Security Foundations',
		summary: 'Introductory course on secure AI-assisted development.',
		modality: 'online',
		status: 'active',
		tags: ['ai', 'security'],
		createdAt: '2026-01-15T00:00:00.000Z',
		updatedAt: '2026-06-01T00:00:00.000Z',
		...overrides,
	};
}

function catalogFor(courses: readonly Course[], now: () => string = () => STAMP) {
	const requests: EnrollmentRequest[] = [];
	let next = 0;
	return buildApplicationServicesFactory(
		{ environment: 'test' },
		{
			courses: {
				list() {
					return Promise.resolve(courses.map((item) => ({ ...item, tags: [...item.tags] })));
				},
			},
			enrollmentRequests: {
				list() {
					return Promise.resolve(requests.map((request) => structuredClone(request)));
				},
				findById(id) {
					const found = requests.find((request) => request.id === id);
					return Promise.resolve(found === undefined ? undefined : structuredClone(found));
				},
				save(request) {
					const stored = structuredClone(request);
					const index = requests.findIndex((item) => item.id === stored.id);
					if (index === -1) {
						requests.push(stored);
					} else {
						requests[index] = stored;
					}
					return Promise.resolve();
				},
			},
			now,
			newId() {
				next += 1;
				return `enroll-${String(next).padStart(3, '0')}`;
			},
		},
	).forRequest();
}

function unwrap<T>(result: CatalogResult<T>): T {
	if (!result.ok) {
		throw new Error(`${result.error.code}: ${result.error.details.map((detail) => detail.message).join('; ')}`);
	}
	return result.value;
}

function expectError(result: CatalogResult<unknown>, status: 400 | 404 | 409, code: string, detail?: { field: string; message: string }) {
	if (result.ok) {
		throw new Error(`expected ${code}`);
	}
	expect(result.status).toBe(status);
	expect(result.error.code).toBe(code);
	expect(result.error.message).toBe(code === 'INVALID_QUERY_PARAMETER' ? 'One or more query parameters are invalid.' : 'The request could not be completed.');
	if (detail !== undefined) {
		expect(result.error.details).toContainEqual(detail);
	}
}

function pageFixture(): Course[] {
	const modalities = ['online', 'in-person', 'hybrid'] as const;
	const statuses = ['draft', 'active', 'retired'] as const;
	const courses = Array.from({ length: 12 }, (_, index) =>
		course({
			id: `course-${String(index + 1).padStart(3, '0')}`,
			title: `Course ${String.fromCharCode(65 + index)}`,
			summary: `Summary ${index}`,
			modality: modalities[index % 3] ?? 'online',
			status: statuses[index % 3] ?? 'draft',
			tags: ['general'],
			createdAt: `2026-01-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
			updatedAt: `2026-06-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
		}),
	);
	const last = courses[11];
	if (last !== undefined) {
		last.createdAt = '2025-01-01T00:00:00.000Z';
	}
	return courses;
}

function filterFixture(): Course[] {
	return [
		course({ id: 'course-001', title: 'Alpha', summary: 'Intro', tags: ['Security'], modality: 'online', status: 'draft' }),
		course({ id: 'course-002', title: 'Beta', summary: 'Security in the summary', tags: ['general'], modality: 'in-person', status: 'active' }),
		course({ id: 'course-003', title: 'Gamma', summary: 'Other', tags: ['AI'], modality: 'hybrid', status: 'retired' }),
		course({ id: 'course-004', title: 'Online Active Security', summary: 'Ready', tags: ['general'], modality: 'online', status: 'active' }),
		course({ id: 'course-005', title: 'Delta', summary: 'Plain', tags: ['general'], modality: 'online', status: 'active' }),
	];
}

const enrollmentCourses = [course({ id: 'course-001' }), course({ id: 'course-draft', status: 'draft' }), course({ id: 'course-retired', status: 'retired' }), course({ id: 'course-002', title: 'Second active course' })];

describe('course search', () => {
	it('returns the default page sorted by title', async () => {
		const api = await catalogFor(pageFixture());
		const page = unwrap(await api.courses.search({}));
		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
		expect(page.totalItems).toBe(12);
		expect(page.totalPages).toBe(2);
		expect(page.items).toHaveLength(10);
		expect(page.items[0]?.id).toBe('course-001');
		expect(page.items[9]?.id).toBe('course-010');
	});

	it('matches q across title, summary, and tags without case sensitivity', async () => {
		const api = await catalogFor(filterFixture());
		const page = unwrap(await api.courses.search({ q: 'SECURITY' }));
		expect(page.items.map((item) => item.id).sort()).toEqual(['course-001', 'course-002', 'course-004']);
	});

	it('filters modality, status, and tag', async () => {
		const api = await catalogFor(filterFixture());
		expect(unwrap(await api.courses.search({ modality: 'online' })).items.every((item) => item.modality === 'online')).toBe(true);
		expect(unwrap(await api.courses.search({ status: 'active' })).items.every((item) => item.status === 'active')).toBe(true);
		expect(unwrap(await api.courses.search({ tag: 'ai' })).items.map((item) => item.id)).toEqual(['course-003']);
	});

	it('applies q, modality, and status together', async () => {
		const api = await catalogFor(filterFixture());
		const page = unwrap(await api.courses.search({ q: 'security', modality: 'online', status: 'active' }));
		expect(page.items.map((item) => item.id)).toEqual(['course-004']);
	});

	it('paginates and sorts by createdAt', async () => {
		const api = await catalogFor(pageFixture());
		const page = unwrap(await api.courses.search({ page: '2', pageSize: '10' }));
		expect(page.items.map((item) => item.id)).toEqual(['course-011', 'course-012']);
		expect(page.totalPages).toBe(2);
		const sorted = unwrap(await api.courses.search({ sort: 'createdAt', pageSize: '50' }));
		expect(sorted.items[0]?.id).toBe('course-012');
		expect(sorted.pageSize).toBe(50);
		expect(sorted.items).toHaveLength(12);
	});

	it('returns an empty page when nothing matches', async () => {
		const api = await catalogFor(filterFixture());
		const page = unwrap(await api.courses.search({ q: 'missing-term' }));
		expect(page.items).toEqual([]);
		expect(page.totalItems).toBe(0);
		expect(page.totalPages).toBe(0);
		expect(page.page).toBe(1);
	});

	it('rejects invalid query parameters', async () => {
		const api = await catalogFor(filterFixture());
		expectError(await api.courses.search({ modality: 'classroom' }), 400, 'INVALID_QUERY_PARAMETER', { field: 'modality', message: 'modality must be online, in-person, or hybrid.' });
		expectError(await api.courses.search({ status: 'open' }), 400, 'INVALID_QUERY_PARAMETER', { field: 'status', message: 'status must be draft, active, or retired.' });
		expectError(await api.courses.search({ page: '0' }), 400, 'INVALID_QUERY_PARAMETER', { field: 'page', message: 'page must be an integer greater than or equal to 1.' });
		expectError(await api.courses.search({ pageSize: '0' }), 400, 'INVALID_QUERY_PARAMETER', { field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		expectError(await api.courses.search({ pageSize: '51' }), 400, 'INVALID_QUERY_PARAMETER', { field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		expectError(await api.courses.search({ sort: 'id' }), 400, 'INVALID_QUERY_PARAMETER', { field: 'sort', message: 'sort must be title, createdAt, or updatedAt.' });
		expectError(await api.courses.search({ limit: '1' }), 400, 'INVALID_QUERY_PARAMETER', { field: 'limit', message: 'limit is not a supported query parameter.' });
	});
});

describe('enrollment requests', () => {
	it('creates a pending request and records the initial history entry', async () => {
		const api = await catalogFor(enrollmentCourses);
		const created = unwrap(await api.enrollmentRequests.create({ courseId: 'course-001', learnerEmail: ' Learner@Example.org ', justification: JUSTIFICATION }));
		expect(created).toMatchObject({
			id: 'enroll-001',
			courseId: 'course-001',
			learnerEmail: 'Learner@Example.org',
			justification: JUSTIFICATION,
			status: 'pending',
			createdAt: STAMP,
			updatedAt: STAMP,
		});
		expect(created.statusHistory).toEqual([{ fromStatus: null, toStatus: 'pending', changedAt: STAMP, changedBy: 'system', reason: null }]);
		expect(unwrap(await api.enrollmentRequests.getById(created.id))).toEqual(created);
	});

	it('rejects a missing, draft, or retired course', async () => {
		const api = await catalogFor(enrollmentCourses);
		expectError(await api.enrollmentRequests.create({ ...validBody(), courseId: 'missing' }), 404, 'COURSE_NOT_FOUND', { field: 'courseId', message: 'Course not found.' });
		expectError(await api.enrollmentRequests.create({ ...validBody(), courseId: 'course-draft' }), 409, 'COURSE_NOT_ACTIVE', { field: 'courseId', message: 'Course is not active.' });
		expectError(await api.enrollmentRequests.create({ ...validBody(), courseId: 'course-retired' }), 409, 'COURSE_NOT_ACTIVE');
		const listed = unwrap(await api.enrollmentRequests.list({}));
		expect(listed).toEqual([]);
	});

	it('rejects an invalid email and a justification outside 20 to 500 characters', async () => {
		const api = await catalogFor(enrollmentCourses);
		expectError(await api.enrollmentRequests.create({ ...validBody(), learnerEmail: 'not-an-email' }), 400, 'INVALID_REQUEST', { field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' });
		expectError(await api.enrollmentRequests.create({ ...validBody(), justification: 'a'.repeat(19) }), 400, 'INVALID_REQUEST', { field: 'justification', message: 'justification must be between 20 and 500 characters.' });
		expectError(await api.enrollmentRequests.create({ ...validBody(), justification: 'a'.repeat(501) }), 400, 'INVALID_REQUEST', { field: 'justification', message: 'justification must be between 20 and 500 characters.' });
		const created = unwrap(await api.enrollmentRequests.create({ ...validBody(), justification: 'a'.repeat(20) }));
		expect(created.justification).toHaveLength(20);
		expect(unwrap(await api.enrollmentRequests.create({ ...validBody(), learnerEmail: 'edge@example.org', justification: 'b'.repeat(500) })).justification).toHaveLength(500);
	});

	it('blocks a second pending or approved request and allows one after rejection or cancellation', async () => {
		const api = await catalogFor(enrollmentCourses);
		const first = unwrap(await api.enrollmentRequests.create(validBody()));
		expectError(await api.enrollmentRequests.create({ ...validBody(), learnerEmail: 'learner@example.org' }), 409, 'DUPLICATE_ACTIVE_REQUEST');
		expect(unwrap(await api.enrollmentRequests.list({})).map((request) => request.id)).toEqual([first.id]);

		unwrap(await api.enrollmentRequests.updateStatus(first.id, { status: 'approved', changedBy: 'reviewer@example.org' }));
		expectError(await api.enrollmentRequests.create(validBody()), 409, 'DUPLICATE_ACTIVE_REQUEST');
		unwrap(await api.enrollmentRequests.updateStatus(first.id, { status: 'cancelled', changedBy: 'reviewer@example.org' }));
		expect(unwrap(await api.enrollmentRequests.create(validBody())).status).toBe('pending');

		const rejected = unwrap(await api.enrollmentRequests.create({ ...validBody(), courseId: 'course-002' }));
		unwrap(await api.enrollmentRequests.updateStatus(rejected.id, { status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Missing prerequisite.' }));
		expect(unwrap(await api.enrollmentRequests.create({ ...validBody(), courseId: 'course-002' })).id).toBe('enroll-004');
	});

	it('filters by status, courseId, and learnerEmail', async () => {
		const api = await catalogFor(enrollmentCourses);
		const pending = unwrap(await api.enrollmentRequests.create(validBody()));
		const other = unwrap(await api.enrollmentRequests.create({ ...validBody(), courseId: 'course-002', learnerEmail: 'other@example.org' }));
		unwrap(await api.enrollmentRequests.updateStatus(other.id, { status: 'approved', changedBy: 'reviewer@example.org' }));

		expect(unwrap(await api.enrollmentRequests.list({ status: 'pending' })).map((request) => request.id)).toEqual([pending.id]);
		expect(unwrap(await api.enrollmentRequests.list({ courseId: 'course-002' })).map((request) => request.id)).toEqual([other.id]);
		expect(unwrap(await api.enrollmentRequests.list({ learnerEmail: 'LEARNER@EXAMPLE.ORG' })).map((request) => request.id)).toEqual([pending.id]);
		expect(unwrap(await api.enrollmentRequests.list({ status: 'approved', courseId: 'course-002', learnerEmail: 'other@example.org' })).map((request) => request.id)).toEqual([other.id]);
		expect(unwrap(await api.enrollmentRequests.list({ status: 'cancelled' }))).toEqual([]);
		expectError(await api.enrollmentRequests.list({ status: 'open' }), 400, 'INVALID_REQUEST', { field: 'status', message: 'status must be pending, approved, rejected, or cancelled.' });
	});

	it('applies the allowed status transitions and appends history', async () => {
		const stamps = ['2026-06-27T10:00:00.000Z', '2026-06-27T11:00:00.000Z', '2026-06-27T12:00:00.000Z'];
		let tick = 0;
		const api = await catalogFor(enrollmentCourses, () => {
			const stamp = stamps[Math.min(tick, stamps.length - 1)] ?? STAMP;
			tick += 1;
			return stamp;
		});
		const created = unwrap(await api.enrollmentRequests.create(validBody()));
		const approved = unwrap(await api.enrollmentRequests.updateStatus(created.id, { status: 'approved', changedBy: 'reviewer@example.org' }));
		const cancelled = unwrap(await api.enrollmentRequests.updateStatus(created.id, { status: 'cancelled', changedBy: 'reviewer@example.org', reason: 'Learner withdrew.' }));
		expect(cancelled.status).toBe('cancelled');
		expect(cancelled.createdAt).toBe(stamps[0]);
		expect(cancelled.updatedAt).toBe(stamps[2]);
		expect(cancelled.statusHistory.map((entry) => [entry.fromStatus, entry.toStatus, entry.changedBy, entry.changedAt, entry.reason])).toEqual([
			[null, 'pending', 'system', stamps[0], null],
			['pending', 'approved', 'reviewer@example.org', stamps[1], null],
			['approved', 'cancelled', 'reviewer@example.org', stamps[2], 'Learner withdrew.'],
		]);
		expect(approved.statusHistory).toHaveLength(2);

		const pending = unwrap(await api.enrollmentRequests.create({ ...validBody(), learnerEmail: 'second@example.org' }));
		expect(unwrap(await api.enrollmentRequests.updateStatus(pending.id, { status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Missing prerequisite.' })).statusHistory.at(-1)).toMatchObject({
			fromStatus: 'pending',
			toStatus: 'rejected',
			reason: 'Missing prerequisite.',
		});
		const toCancel = unwrap(await api.enrollmentRequests.create({ ...validBody(), learnerEmail: 'third@example.org' }));
		expect(unwrap(await api.enrollmentRequests.updateStatus(toCancel.id, { status: 'cancelled', changedBy: 'learner@example.org' })).status).toBe('cancelled');
	});

	it('rejects invalid transitions and a rejection without a reason', async () => {
		const api = await catalogFor(enrollmentCourses);
		const created = unwrap(await api.enrollmentRequests.create(validBody()));
		expectError(await api.enrollmentRequests.updateStatus(created.id, { status: 'rejected', changedBy: 'reviewer@example.org' }), 400, 'INVALID_REQUEST', {
			field: 'reason',
			message: 'Rejection requires a non-empty reason.',
		});
		expectError(await api.enrollmentRequests.updateStatus(created.id, { status: 'rejected', changedBy: 'reviewer@example.org', reason: '   ' }), 400, 'INVALID_REQUEST');
		expect(unwrap(await api.enrollmentRequests.getById(created.id)).statusHistory).toHaveLength(1);

		expectError(await api.enrollmentRequests.updateStatus(created.id, { status: 'pending', changedBy: 'reviewer@example.org' }), 409, 'INVALID_STATUS_TRANSITION');
		expectError(await api.enrollmentRequests.updateStatus('missing', { status: 'approved', changedBy: 'reviewer@example.org' }), 404, 'ENROLLMENT_REQUEST_NOT_FOUND');
		expectError(await api.enrollmentRequests.updateStatus(created.id, { status: 'nope', changedBy: 'reviewer@example.org' }), 400, 'INVALID_REQUEST', {
			field: 'status',
			message: 'status must be pending, approved, rejected, or cancelled.',
		});

		unwrap(await api.enrollmentRequests.updateStatus(created.id, { status: 'approved', changedBy: 'reviewer@example.org' }));
		expectError(await api.enrollmentRequests.updateStatus(created.id, { status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Too late.' }), 409, 'INVALID_STATUS_TRANSITION');
		unwrap(await api.enrollmentRequests.updateStatus(created.id, { status: 'cancelled', changedBy: 'reviewer@example.org' }));
		expectError(await api.enrollmentRequests.updateStatus(created.id, { status: 'approved', changedBy: 'reviewer@example.org' }), 409, 'INVALID_STATUS_TRANSITION');
		expectError(await api.enrollmentRequests.getById('missing'), 404, 'ENROLLMENT_REQUEST_NOT_FOUND');
	});
});

function validBody() {
	return { courseId: 'course-001', learnerEmail: 'learner@example.org', justification: JUSTIFICATION };
}
