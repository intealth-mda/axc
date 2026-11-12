import { courseSeed, InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { searchCourses } from './courses.ts';
import { ServiceError } from './service-error.ts';

const repo = new InMemoryCourseRepository(courseSeed);

describe('searchCourses', () => {
	it('defaults page 1, size 10, sorted by title', async () => {
		const r = await searchCourses(repo, {});
		expect([r.page, r.pageSize, r.totalItems, r.totalPages, r.items.length]).toEqual([1, 10, 12, 2, 10]);
		expect(r.items[0]?.title).toBe('Agile Leadership');
	});
	it('combines q, modality, status', async () => {
		const r = await searchCourses(repo, { q: 'SECURITY', modality: 'online', status: 'active' });
		expect(r.items.map((c) => c.id)).toEqual(['course-001']);
	});
	it.each([{ modality: 'x' }, { status: 'x' }, { sort: 'x' }, { page: '0' }, { pageSize: '51' }, { page: 'a' }])('rejects %o', async (q) => {
		await expect(searchCourses(repo, q)).rejects.toBeInstanceOf(ServiceError);
	});
});
