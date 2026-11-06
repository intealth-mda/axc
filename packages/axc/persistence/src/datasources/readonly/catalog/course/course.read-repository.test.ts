import { describe, expect, it } from 'vitest';
import { createCourseReadRepository } from './course.read-repository.ts';

const defaults = { page: 1, pageSize: 50, sort: 'title' };
describe('course read repository', () => {
	it('seeds twelve complete courses across all modalities and statuses', async () => {
		const result = await createCourseReadRepository().search(defaults);
		expect(result.totalItems).toBe(12);
		expect(new Set(result.items.map((c) => c.id)).size).toBe(12);
		expect(new Set(result.items.map((c) => c.modality)).size).toBe(3);
		expect(new Set(result.items.map((c) => c.status)).size).toBe(3);
		for (const course of result.items) {
			expect(Object.keys(course).sort()).toEqual(['id', 'title', 'summary', 'modality', 'status', 'tags', 'createdAt', 'updatedAt'].sort());
			expect(course.tags.length).toBeGreaterThan(0);
			expect(new Date(course.createdAt).toISOString()).toBe(course.createdAt);
			expect(new Date(course.updatedAt).toISOString()).toBe(course.updatedAt);
		}
	});
	it('matches keywords in title, summary and tags without case sensitivity', async () => {
		const result = await createCourseReadRepository().search({ ...defaults, q: 'SeCuRiTy' });
		expect(result.items.map((c) => c.id)).toEqual(['course-001', 'course-002', 'course-003', 'course-008', 'course-012']);
	});
	it.each([
		[{ modality: 'online' }, ['course-001', 'course-002', 'course-006', 'course-009']],
		[{ status: 'active' }, ['course-001', 'course-002', 'course-004', 'course-005', 'course-007', 'course-011']],
		[{ tag: 'AI' }, ['course-001', 'course-005', 'course-011']],
		[{ q: 'security', modality: 'online', status: 'active' }, ['course-001', 'course-002']],
		[{ modality: 'hybrid', status: 'active', tag: 'AI' }, ['course-005', 'course-011']],
		[{ tag: 'a' }, []],
	])('filters %j', async (filters, ids) => {
		const result = await createCourseReadRepository().search({ ...defaults, ...filters });
		expect(result.items.map((c) => c.id)).toEqual(ids);
		expect(result.totalItems).toBe(ids.length);
	});
	it.each(['title', 'createdAt', 'updatedAt'])('sorts ascending by %s before paging', async (sort) => {
		const repo = createCourseReadRepository();
		const all = await repo.search({ ...defaults, sort });
		const values = all.items.map((c) => c[sort as 'title' | 'createdAt' | 'updatedAt']);
		expect(values).toEqual([...values].sort((a, b) => a.localeCompare(b)));
		const result = await repo.search({ page: 2, pageSize: 5, sort });
		expect(result).toEqual({ items: all.items.slice(5, 10), page: 2, pageSize: 5, totalItems: 12, totalPages: 3 });
	});
	it('returns an empty final page and no-match metadata', async () => {
		const repo = createCourseReadRepository();
		expect(await repo.search({ ...defaults, page: 99 })).toEqual({ items: [], page: 99, pageSize: 50, totalItems: 12, totalPages: 1 });
		expect(await repo.search({ ...defaults, q: 'zzzz' })).toEqual({ items: [], page: 1, pageSize: 50, totalItems: 0, totalPages: 0 });
	});
	it('copies records and tags on read', async () => {
		const repo = createCourseReadRepository();
		const first = (await repo.search(defaults)).items[0];
		if (!first) throw new Error('Missing fixture');
		first.tags.push('tampered');
		Object.assign(first, { title: 'tampered' });
		const next = (await repo.search(defaults)).items[0];
		expect(next?.title).toBe('AI Security Foundations');
		expect(next?.tags).toEqual(['ai', 'security']);
	});
});
