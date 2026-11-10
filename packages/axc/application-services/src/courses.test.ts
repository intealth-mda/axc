import { InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { courseService } from './courses.ts';

const svc = courseService(new InMemoryCourseRepository());

describe('course search', () => {
	it('defaults to page 1, size 10, sorted by title', async () => {
		const r = await svc.search({});
		expect(r).toMatchObject({ page: 1, pageSize: 10, totalItems: 7, totalPages: 1 });
		expect(r.items.map((c) => c.title)).toEqual([...r.items.map((c) => c.title)].sort((a, b) => a.localeCompare(b)));
	});
	it('combines q, modality and status', async () => {
		const r = await svc.search({ q: 'SECURITY', modality: 'online', status: 'active' });
		expect(r.items.map((c) => c.id)).toEqual(['course-001', 'course-007']);
	});
	it('filters by tag and paginates', async () => {
		expect((await svc.search({ tag: 'AI' })).totalItems).toBe(2);
		const r = await svc.search({ page: '2', pageSize: '5', sort: 'createdAt' });
		expect(r).toMatchObject({ page: 2, totalPages: 2 });
		expect(r.items).toHaveLength(2);
	});
	it.each([{ modality: 'x' }, { status: 'x' }, { page: '0' }, { page: 'a' }, { pageSize: '51' }, { sort: 'id' }])('rejects %j', async (q) => {
		await expect(svc.search(q)).rejects.toMatchObject({ code: 'INVALID_QUERY_PARAMETER' });
	});
});
