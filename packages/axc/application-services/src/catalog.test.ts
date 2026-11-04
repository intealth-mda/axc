import { seedCourses } from '@axc/domain';
import { describe, expect, it } from 'vitest';
import type { CourseSearchQuery, ServiceError, ServiceResult } from './catalog.ts';
import { createCatalogDependencies, inMemoryCourses } from './catalog-test-support.ts';
import { buildApplicationServicesFactory } from './index.ts';

const justification = 'I need this course to prepare for upcoming secure development work.';
const timestamp = '2026-06-27T10:00:00.000Z';

describe('course search', () => {
	it('seeds a mixed catalog of at least 12 courses', () => {
		expect(seedCourses.length).toBeGreaterThanOrEqual(12);
		expect(new Set(seedCourses.map((course) => course.modality)).size).toBe(3);
		expect(new Set(seedCourses.map((course) => course.status)).size).toBe(3);
	});

	it('returns the default page sorted by title', async () => {
		const page = await search({});
		const expected = [...seedCourses]
			.sort((left, right) => compareText(left.title, right.title) || compareText(left.id, right.id))
			.slice(0, 10)
			.map((course) => course.id);
		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
		expect(page.totalItems).toBe(seedCourses.length);
		expect(page.totalPages).toBe(2);
		expect(page.items.map((course) => course.id)).toEqual(expected);
	});

	it('matches q across title, summary, and tags regardless of case', async () => {
		const page = await search({ q: 'SeCuRiTy' });
		expect(page.items.map((course) => course.id).sort()).toEqual(['course-001', 'course-002', 'course-005', 'course-007', 'course-009', 'course-012']);
		const summaryMatch = await search({ q: 'runbooks' });
		expect(summaryMatch.items.map((course) => course.id)).toEqual(['course-008']);
	});

	it('filters by modality, status, and tag', async () => {
		expect((await search({ modality: 'online' })).items.every((course) => course.modality === 'online')).toBe(true);
		expect((await search({ status: 'active' })).items.every((course) => course.status === 'active')).toBe(true);
		expect((await search({ tag: 'AI' })).items.map((course) => course.id).sort()).toEqual(['course-001', 'course-010']);
	});

	it('applies q, modality, and status together', async () => {
		const page = await search({ q: 'security', modality: 'online', status: 'active' });
		expect(page.items.map((course) => course.id)).toEqual(['course-001']);
		expect(page.totalItems).toBe(1);
	});

	it('paginates and sorts by createdAt', async () => {
		const page = await search({ page: '2', pageSize: '5', sort: 'createdAt' });
		expect(page.items).toHaveLength(5);
		expect(page.page).toBe(2);
		expect(page.pageSize).toBe(5);
		expect(page.totalItems).toBe(12);
		expect(page.totalPages).toBe(3);
		expect(page.items.map((course) => course.createdAt)).toEqual([...page.items.map((course) => course.createdAt)].sort());
		expect(page.items[0]?.id).toBe('course-006');
	});

	it('returns an empty page when nothing matches', async () => {
		const page = await search({ q: 'zzzz-not-a-course' });
		expect(page.items).toEqual([]);
		expect(page.totalItems).toBe(0);
		expect(page.totalPages).toBe(0);
		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
	});

	it('rejects invalid query parameters', async () => {
		const cases: Array<[CourseSearchQuery, string, string]> = [
			[{ modality: 'remote' }, 'modality', 'modality must be online, in-person, or hybrid.'],
			[{ status: 'open' }, 'status', 'status must be draft, active, or retired.'],
			[{ page: '0' }, 'page', 'page must be an integer greater than or equal to 1.'],
			[{ page: '1.5' }, 'page', 'page must be an integer greater than or equal to 1.'],
			[{ pageSize: '0' }, 'pageSize', 'pageSize must be between 1 and 50.'],
			[{ pageSize: '51' }, 'pageSize', 'pageSize must be between 1 and 50.'],
			[{ sort: 'name' }, 'sort', 'sort must be title, createdAt, or updatedAt.'],
		];
		for (const [query, field, message] of cases) {
			const error = requireError(await (await catalog()).courses.search(query));
			expect(error.status).toBe(400);
			expect(error.code).toBe('INVALID_QUERY_PARAMETER');
			expect(error.message).toBe('One or more query parameters are invalid.');
			expect(error.details).toEqual([{ field, message }]);
		}
	});
});

describe('enrollment requests', () => {
	it('creates a pending request with an initial history entry', async () => {
		const services = await catalog();
		const created = await services.enrollmentRequests.create(validBody());
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}
		expect(created.value).toMatchObject({
			id: 'enroll-001',
			courseId: 'course-001',
			learnerEmail: 'learner@example.org',
			justification,
			status: 'pending',
			createdAt: timestamp,
			updatedAt: timestamp,
		});
		expect(created.value.statusHistory).toEqual([
			{
				fromStatus: null,
				toStatus: 'pending',
				changedAt: timestamp,
				changedBy: 'system',
				reason: null,
			},
		]);
	});

	it('rejects a missing, draft, or retired course', async () => {
		const services = await catalog();
		expect(requireError(await services.enrollmentRequests.create(validBody({ courseId: 'missing' })))).toMatchObject({ status: 404, code: 'COURSE_NOT_FOUND' });
		expect(requireError(await services.enrollmentRequests.create(validBody({ courseId: 'course-003' })))).toMatchObject({ status: 409, code: 'COURSE_NOT_ACTIVE' });
		expect(requireError(await services.enrollmentRequests.create(validBody({ courseId: 'course-005' })))).toMatchObject({ status: 409, code: 'COURSE_NOT_ACTIVE' });
		const listed = await services.enrollmentRequests.list({});
		expect(listed.ok).toBe(true);
		if (listed.ok) {
			expect(listed.value.items).toEqual([]);
		}
	});

	it('rejects an invalid email or a justification outside 20 to 500 characters', async () => {
		const services = await catalog();
		const invalidEmail = requireError(await services.enrollmentRequests.create(validBody({ learnerEmail: 'not-an-email' })));
		expect(invalidEmail).toMatchObject({ status: 400, code: 'INVALID_REQUEST', message: 'The request could not be completed.' });
		expect(invalidEmail.details).toEqual([{ field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' }]);
		const shortJustification = requireError(await services.enrollmentRequests.create(validBody({ justification: 'a'.repeat(19) })));
		expect(shortJustification.details).toEqual([{ field: 'justification', message: 'justification must be between 20 and 500 characters.' }]);
		expect(requireError(await services.enrollmentRequests.create(validBody({ justification: 'a'.repeat(501) }))).details[0]?.field).toBe('justification');
		expect((await services.enrollmentRequests.create(validBody({ justification: 'a'.repeat(20) }))).ok).toBe(true);
		expect((await services.enrollmentRequests.create(validBody({ learnerEmail: 'other@example.org', justification: 'a'.repeat(500) }))).ok).toBe(true);
	});

	it('blocks a second pending or approved request for the same learner and course', async () => {
		const services = await catalog();
		expect((await services.enrollmentRequests.create(validBody())).ok).toBe(true);
		expect(requireError(await services.enrollmentRequests.create(validBody({ learnerEmail: 'Learner@Example.org' })))).toMatchObject({
			status: 409,
			code: 'DUPLICATE_ACTIVE_REQUEST',
		});
		expect((await services.enrollmentRequests.updateStatus('enroll-001', { status: 'approved', changedBy: 'reviewer@example.org' })).ok).toBe(true);
		expect(requireError(await services.enrollmentRequests.create(validBody()))).toMatchObject({ status: 409, code: 'DUPLICATE_ACTIVE_REQUEST' });
	});

	it('allows a new request after rejection or cancellation', async () => {
		const services = await catalog();
		expect((await services.enrollmentRequests.create(validBody())).ok).toBe(true);
		expect((await services.enrollmentRequests.updateStatus('enroll-001', { status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Missing prerequisite.' })).ok).toBe(true);
		expect((await services.enrollmentRequests.create(validBody())).ok).toBe(true);
		expect((await services.enrollmentRequests.updateStatus('enroll-002', { status: 'cancelled', changedBy: 'learner@example.org' })).ok).toBe(true);
		expect((await services.enrollmentRequests.create(validBody())).ok).toBe(true);
	});

	it('returns a request by id with its status history', async () => {
		const services = await catalog();
		await services.enrollmentRequests.create(validBody());
		const found = await services.enrollmentRequests.getById('enroll-001');
		expect(found.ok).toBe(true);
		if (found.ok) {
			expect(found.value.id).toBe('enroll-001');
			expect(found.value.statusHistory).toHaveLength(1);
		}
		expect(requireError(await services.enrollmentRequests.getById('missing'))).toMatchObject({ status: 404, code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
	});

	it('filters by status, courseId, and learnerEmail', async () => {
		const services = await catalog();
		await services.enrollmentRequests.create(validBody());
		await services.enrollmentRequests.create(validBody({ courseId: 'course-002', learnerEmail: 'learner@example.org' }));
		await services.enrollmentRequests.create(validBody({ learnerEmail: 'other@example.org' }));
		await services.enrollmentRequests.updateStatus('enroll-003', { status: 'approved', changedBy: 'reviewer@example.org' });

		const byStatus = await services.enrollmentRequests.list({ status: 'pending' });
		const byCourse = await services.enrollmentRequests.list({ courseId: 'course-001' });
		const byEmail = await services.enrollmentRequests.list({ learnerEmail: 'LEARNER@example.org' });
		const combined = await services.enrollmentRequests.list({ status: 'pending', courseId: 'course-001', learnerEmail: 'learner@example.org' });
		expect(ids(byStatus)).toEqual(['enroll-001', 'enroll-002']);
		expect(ids(byCourse)).toEqual(['enroll-001', 'enroll-003']);
		expect(ids(byEmail)).toEqual(['enroll-001', 'enroll-002']);
		expect(ids(combined)).toEqual(['enroll-001']);
		expect(requireError(await services.enrollmentRequests.list({ status: 'nope' }))).toMatchObject({ status: 400, code: 'INVALID_REQUEST' });
	});

	it('applies the allowed status transitions and records each change', async () => {
		const approved = await transition('approved', { status: 'approved', changedBy: 'reviewer@example.org' });
		expect(approved.status).toBe('approved');
		expect(approved.statusHistory.map((entry) => entry.toStatus)).toEqual(['pending', 'approved']);
		expect(approved.statusHistory[1]).toMatchObject({ fromStatus: 'pending', changedBy: 'reviewer@example.org', reason: null });

		const rejected = await transition('rejected', { status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Learner has not completed the prerequisite course.' });
		expect(rejected.statusHistory[1]).toMatchObject({ fromStatus: 'pending', toStatus: 'rejected', reason: 'Learner has not completed the prerequisite course.' });

		const cancelled = await transition('cancelled', { status: 'cancelled', changedBy: 'learner@example.org' });
		expect(cancelled.status).toBe('cancelled');

		const services = await catalog();
		await services.enrollmentRequests.create(validBody());
		expect((await services.enrollmentRequests.updateStatus('enroll-001', { status: 'approved', changedBy: 'reviewer@example.org' })).ok).toBe(true);
		const afterApproval = await services.enrollmentRequests.updateStatus('enroll-001', { status: 'cancelled', changedBy: 'reviewer@example.org' });
		expect(afterApproval.ok).toBe(true);
		if (afterApproval.ok) {
			expect(afterApproval.value.status).toBe('cancelled');
			expect(afterApproval.value.statusHistory).toHaveLength(3);
		}
	});

	it('rejects an invalid transition without changing history', async () => {
		const services = await catalog();
		await services.enrollmentRequests.create(validBody());
		await services.enrollmentRequests.updateStatus('enroll-001', { status: 'approved', changedBy: 'reviewer@example.org' });
		const error = requireError(await services.enrollmentRequests.updateStatus('enroll-001', { status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Too late.' }));
		expect(error).toMatchObject({ status: 409, code: 'INVALID_STATUS_TRANSITION' });
		const current = await services.enrollmentRequests.getById('enroll-001');
		if (current.ok) {
			expect(current.value.status).toBe('approved');
			expect(current.value.statusHistory).toHaveLength(2);
		}
	});

	it('requires a reason to reject', async () => {
		const services = await catalog();
		await services.enrollmentRequests.create(validBody());
		const error = requireError(await services.enrollmentRequests.updateStatus('enroll-001', { status: 'rejected', changedBy: 'reviewer@example.org' }));
		expect(error).toMatchObject({ status: 400, code: 'INVALID_REQUEST' });
		expect(error.details).toEqual([{ field: 'reason', message: 'reason is required when rejecting a request.' }]);
		const current = await services.enrollmentRequests.getById('enroll-001');
		if (current.ok) {
			expect(current.value.statusHistory).toHaveLength(1);
		}
	});
});

function catalog() {
	return buildApplicationServicesFactory(
		{ environment: 'test' },
		createCatalogDependencies({
			courses: inMemoryCourses([...seedCourses].reverse()),
		}),
	).forRequest();
}

async function search(query: CourseSearchQuery) {
	const result = await (await catalog()).courses.search(query);
	if (!result.ok) {
		throw new Error(`expected courses, received ${result.error.code}`);
	}
	return result.value;
}

function validBody(overrides?: Record<string, string>) {
	return {
		courseId: 'course-001',
		learnerEmail: 'learner@example.org',
		justification,
		...overrides,
	};
}

function requireError<T>(result: ServiceResult<T>): ServiceError {
	if (result.ok) {
		throw new Error('expected an error');
	}
	return result.error;
}

function ids(result: ServiceResult<{ items: { id: string }[] }>): string[] {
	if (!result.ok) {
		throw new Error(result.error.code);
	}
	return result.value.items.map((item) => item.id);
}

async function transition(status: string, body: Record<string, string>) {
	const services = await catalog();
	expect((await services.enrollmentRequests.create(validBody())).ok).toBe(true);
	const updated = await services.enrollmentRequests.updateStatus('enroll-001', body);
	expect(updated.ok).toBe(true);
	if (!updated.ok) {
		throw new Error(status);
	}
	return updated.value;
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
