import { describe, expect, it } from 'vitest';
import { courses } from '../../../../seed/catalog/course.ts';
import { createCourseReadRepository } from './course.read-repository.ts';

const repo = createCourseReadRepository(courses);
const defaults = { page: 1, pageSize: 10, sort: 'title' };
const ids = (items: readonly { id: string }[]) => items.map((item) => item.id);
describe('course repository', () => {
	it('seeds twelve complete unique courses with mixed values', () => {
		expect(courses).toHaveLength(12);
		expect(new Set(ids(courses)).size).toBe(12);
		expect(new Set(courses.map((course) => course.modality)).size).toBe(3);
		expect(new Set(courses.map((course) => course.status)).size).toBe(3);
		for (const course of courses) {
			expect(course.title).not.toBe('');
			expect(course.summary).not.toBe('');
			expect(course.tags.length).toBeGreaterThan(0);
			expect(new Date(course.createdAt).toISOString()).toBe(course.createdAt);
			expect(new Date(course.updatedAt).toISOString()).toBe(course.updatedAt);
		}
	});
	it('returns default pagination and title order', async () => {
		const result = await repo.search(defaults);
		expect(result).toMatchObject({ page: 1, pageSize: 10, totalItems: 12, totalPages: 2 });
		expect(ids(result.items)).toEqual(Array.from({ length: 10 }, (_, i) => `course-${String(i + 1).padStart(3, '0')}`));
	});
	it('searches title, summary and tags without case sensitivity', async () => {
		expect(ids((await repo.search({ ...defaults, q: 'sEcUrItY' })).items)).toEqual(['course-001', 'course-002', 'course-003', 'course-009']);
	});
	it.each([
		[{ modality: 'online' }, ['course-001', 'course-002', 'course-005', 'course-007', 'course-010']],
		[{ status: 'active' }, ['course-001', 'course-002', 'course-004', 'course-006', 'course-009', 'course-010', 'course-012']],
		[{ tag: 'AI' }, ['course-001', 'course-007']],
		[{ q: 'security', modality: 'online', status: 'active' }, ['course-001', 'course-002']],
		[{ tag: 'security', status: 'active' }, ['course-001', 'course-009']],
		[{ tag: 'sec' }, []],
	])('filters %j', async (filters, expected) => {
		expect(ids((await repo.search({ ...defaults, ...filters })).items)).toEqual(expected);
	});
	it('paginates after filtering and counts the whole result', async () => {
		const result = await repo.search({ ...defaults, q: 'security', page: 2, pageSize: 2 });
		expect(ids(result.items)).toEqual(['course-003', 'course-009']);
		expect(result).toMatchObject({ totalItems: 4, totalPages: 2, page: 2, pageSize: 2 });
	});
	it.each(['title', 'createdAt', 'updatedAt'])('sorts ascending by %s', async (sort) => {
		const result = await repo.search({ ...defaults, pageSize: 50, sort });
		const expected = sort === 'createdAt' ? [...courses].reverse() : courses;
		expect(ids(result.items)).toEqual(ids(expected));
	});
	it('breaks sort ties by id', async () => {
		const firstCourse = courses[0];
		const secondCourse = courses[1];
		if (!firstCourse || !secondCourse) throw new Error('Missing fixture');
		const tied = createCourseReadRepository([
			{ ...secondCourse, title: 'Same' },
			{ ...firstCourse, title: 'Same' },
		]);
		expect(ids((await tied.search(defaults)).items)).toEqual(['course-001', 'course-002']);
	});
	it('returns empty results and out of range pages', async () => {
		expect(await repo.search({ ...defaults, q: 'nonexistent' })).toEqual({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
		expect((await repo.search({ ...defaults, page: Number.MAX_SAFE_INTEGER })).items).toEqual([]);
	});
	it('copies objects and tags on read', async () => {
		const first = await repo.search(defaults);
		first.items[0]?.tags.push('mutation');
		if (first.items[0]) first.items[0].tags[0] = 'changed';
		expect((await repo.search(defaults)).items[0]?.tags).toEqual(['ai', 'security']);
		expect(first.items[0]).not.toBe(courses[0]);
	});
});
