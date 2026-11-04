import { seedCourses } from '@axc/domain';
import { describe, expect, it } from 'vitest';
import { ApplicationError, type ApplicationErrorCode, applicationErrorStatus } from './index.ts';
import { createTestApplicationServices } from './test-support.ts';

const titleOrder = ['course-011', 'course-007', 'course-001', 'course-008', 'course-003', 'course-009', 'course-004', 'course-005', 'course-010', 'course-006', 'course-012', 'course-002'];

describe('course search', () => {
	it('seeds a mixed catalog of 12 courses', () => {
		expect(seedCourses).toHaveLength(12);
		expect(new Set(seedCourses.map((course) => course.modality)).size).toBe(3);
		expect(new Set(seedCourses.map((course) => course.status)).size).toBe(3);
		expect(seedCourses.some((course) => course.tags.length > 0)).toBe(true);
	});

	it('returns the first title page by default', async () => {
		const page = await (await services()).courses.search({});

		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
		expect(page.totalItems).toBe(12);
		expect(page.totalPages).toBe(2);
		expect(page.items.map((course) => course.id)).toEqual(titleOrder.slice(0, 10));
	});

	it('matches a keyword across title, summary, and tags', async () => {
		const page = await (await services()).courses.search({ q: 'SECURITY' });

		expect(page.items.map((course) => course.id)).toEqual(['course-001', 'course-005', 'course-006', 'course-002']);
	});

	it('filters by modality, status, and tag', async () => {
		const courses = (await services()).courses;
		expect((await courses.search({ modality: 'online' })).items.map((course) => course.id)).toEqual(['course-007', 'course-001', 'course-004', 'course-005', 'course-010']);
		const active = await courses.search({ status: 'active', pageSize: '50' });
		expect(active.items).toHaveLength(8);
		expect(active.items.every((course) => course.status === 'active')).toBe(true);
		expect((await courses.search({ tag: 'ai' })).items.map((course) => course.id)).toEqual(['course-007', 'course-001', 'course-010']);
	});

	it('combines keyword, modality, and status', async () => {
		const page = await (await services()).courses.search({ q: 'security', modality: 'online', status: 'active' });

		expect(page.items.map((course) => course.id)).toEqual(['course-001', 'course-005']);
	});

	it('paginates and caps page size at 50', async () => {
		const courses = (await services()).courses;
		const page = await courses.search({ page: '2', pageSize: '5' });
		expect(page).toMatchObject({ page: 2, pageSize: 5, totalItems: 12, totalPages: 3 });
		expect(page.items.map((course) => course.id)).toEqual(['course-009', 'course-004', 'course-005', 'course-010', 'course-006']);
		expect((await courses.search({ pageSize: '50' })).items).toHaveLength(12);
	});

	it('sorts by createdAt', async () => {
		const page = await (await services()).courses.search({ sort: 'createdAt', pageSize: '50' });

		expect(page.items.map((course) => course.id)).toEqual([...seedCourses].sort((left, right) => left.createdAt.localeCompare(right.createdAt, 'en')).map((course) => course.id));
		expect(page.items[0]?.id).toBe('course-009');
	});

	it('rejects invalid query parameters', async () => {
		const error = await capture(() => services().then((api) => api.courses.search({ modality: 'remote', status: 'published', page: '0', pageSize: '51', sort: 'name' })));

		expectCode(error, 'INVALID_QUERY_PARAMETER', 400);
		expect(error.message).toBe('One or more query parameters are invalid.');
		expect(error.details).toEqual([
			{ field: 'modality', message: 'modality must be online, in-person, or hybrid.' },
			{ field: 'status', message: 'status must be draft, active, or retired.' },
			{ field: 'sort', message: 'sort must be title, createdAt, or updatedAt.' },
			{ field: 'page', message: 'page must be an integer greater than or equal to 1.' },
			{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' },
		]);
	});

	it('returns an empty page when nothing matches', async () => {
		const page = await (await services()).courses.search({ q: 'zzzzzz' });

		expect(page).toEqual({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
	});
});

function services() {
	return createTestApplicationServices().forRequest();
}

async function capture(run: () => Promise<unknown>): Promise<ApplicationError> {
	try {
		await run();
	} catch (error) {
		expect(error).toBeInstanceOf(ApplicationError);
		if (error instanceof ApplicationError) {
			return error;
		}
	}
	throw new Error('expected ApplicationError');
}

function expectCode(error: ApplicationError, code: ApplicationErrorCode, status: number): void {
	expect(error.code).toBe(code);
	expect(applicationErrorStatus[error.code]).toBe(status);
}
