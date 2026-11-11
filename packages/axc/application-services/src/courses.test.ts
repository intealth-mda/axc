import { courseSeed, InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { courseService } from './courses.ts';
import { ServiceError } from './service-error.ts';

const svc = courseService(new InMemoryCourseRepository(courseSeed));

describe('courseService.search', () => {
	it('paginates with defaults and filters', async () => {
		const all = await svc.search({});
		expect([all.page, all.pageSize, all.totalItems]).toEqual([1, 10, courseSeed.length]);
		const r = await svc.search({ q: 'security', modality: 'online', status: 'active', pageSize: '1', page: '2', sort: 'createdAt' });
		expect([r.items.map((c) => c.id), r.totalItems, r.totalPages]).toEqual([['course-001'], 2, 2]);
	});
	it.each([{ modality: 'x' }, { status: 'x' }, { page: '0' }, { pageSize: '51' }, { sort: 'id' }])('rejects %o', async (q) => {
		await expect(svc.search(q)).rejects.toThrow(ServiceError);
	});
});
