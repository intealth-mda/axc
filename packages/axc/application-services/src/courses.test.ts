import { InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { createCourseService } from './courses.ts';

const svc = createCourseService(new InMemoryCourseRepository());

describe('course search', () => {
	it('defaults to page 1 size 10 sorted by title', async () => {
		const r = await svc.search({});
		expect([r.page, r.pageSize, r.totalItems, r.totalPages]).toEqual([1, 10, 7, 1]);
		expect(r.items[0]?.title).toBe('Agile Team Practices');
	});

	it('combines q, modality, status, tag', async () => {
		const r = await svc.search({ q: 'SECURITY', modality: 'online', status: 'active', tag: 'Security' });
		expect(r.items.map((c) => c.id)).toEqual(['course-001', 'course-007']);
	});

	it('paginates and sorts by createdAt', async () => {
		const r = await svc.search({ page: '2', pageSize: '3', sort: 'createdAt' });
		expect(r.items.map((c) => c.id)).toEqual(['course-001', 'course-002', 'course-007']);
		expect(r.totalPages).toBe(3);
	});

	it.each([
		['modality', 'x'],
		['status', 'x'],
		['page', '0'],
		['pageSize', '51'],
		['sort', 'id'],
	])('rejects %s=%s', async (field, value) => {
		await expect(svc.search({ [field]: value })).rejects.toMatchObject({ code: 'INVALID_QUERY_PARAMETER', details: [{ field }] });
	});
});
