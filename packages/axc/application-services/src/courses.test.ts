import { courseSeed, InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { courseService } from './courses.ts';

const svc = courseService(new InMemoryCourseRepository(courseSeed));

describe('courseService', () => {
	it('filters, sorts and pages', async () => {
		const r = await svc.search({ q: 'SECURITY', status: 'active', pageSize: '2', sort: 'createdAt' });
		expect(r.items.map((c) => c.id)).toEqual(['course-001', 'course-002']);
		expect([r.totalItems, r.totalPages]).toEqual([3, 2]);
	});
	it('rejects bad params', async () => {
		await expect(svc.search({ pageSize: '51', modality: 'x' })).rejects.toMatchObject({ code: 'INVALID_QUERY_PARAMETER', details: [{ field: 'modality' }, { field: 'pageSize' }] });
	});
});
