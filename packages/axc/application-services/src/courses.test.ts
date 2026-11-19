import { courseSeed, InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { ServiceError, searchCourses } from './courses.ts';

const repo = new InMemoryCourseRepository(courseSeed());

describe('searchCourses', () => {
	it('defaults to page 1, size 10, title sort', async () => {
		const r = await searchCourses(repo, {});
		expect([r.page, r.pageSize, r.totalItems, r.totalPages, r.items.length]).toEqual([1, 10, 12, 2, 10]);
		expect(r.items[0]?.title).toBe('AI Security Foundations');
	});
	it.each([{ page: '0' }, { page: 'x' }, { pageSize: '51' }, { modality: 'remote' }, { status: 'live' }, { sort: 'id' }])('rejects %o', async (q) => {
		await expect(searchCourses(repo, q)).rejects.toBeInstanceOf(ServiceError);
	});
});
