import { courseSeed, InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { buildCourseService } from './courses.ts';

const svc = buildCourseService(new InMemoryCourseRepository(courseSeed));

describe('course search', () => {
	it('filters, sorts and pages', async () => {
		const r = await svc.search({ q: 'SECURITY', modality: 'online', status: 'active', pageSize: '1', sort: 'createdAt' });
		expect([r.items[0]?.id, r.totalItems, r.totalPages]).toEqual(['course-001', 2, 2]);
	});
	it('rejects invalid parameters', async () => {
		await expect(svc.search({ pageSize: '51', modality: 'x', sort: 'id', page: '0', status: 'y' })).rejects.toMatchObject({
			code: 'INVALID_QUERY_PARAMETER',
			details: [{ field: 'page' }, { field: 'pageSize' }, { field: 'modality' }, { field: 'status' }, { field: 'sort' }],
		});
	});
});
