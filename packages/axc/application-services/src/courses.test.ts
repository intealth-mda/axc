import { courseSeed, InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { courseService } from './courses.ts';

const svc = courseService(new InMemoryCourseRepository(courseSeed));

describe('courseService', () => {
	it('paginates and sorts', async () => {
		const r = await svc.search({ pageSize: '5', sort: 'createdAt' });
		expect([r.items.length, r.page, r.totalItems > 5]).toEqual([5, 1, true]);
		expect(r.items[0]?.id).toBe('course-001');
	});
	it('lists every invalid parameter', async () => {
		await expect(svc.search({ modality: 'x', status: 'x', page: '0', pageSize: '51', sort: 'x' })).rejects.toMatchObject({ code: 'INVALID_QUERY_PARAMETER', details: { length: 5 } });
	});
});
