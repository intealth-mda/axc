import { InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { courseService } from './courses.ts';

const svc = courseService(new InMemoryCourseRepository());

describe('courseService.search', () => {
	it('filters, sorts and paginates', async () => {
		const r = await svc.search({ q: 'SECURITY', status: 'active', pageSize: '2', sort: 'createdAt' });
		expect(r.items).toHaveLength(2);
		expect(r.items.every((c) => c.status === 'active')).toBe(true);
		expect(r.totalPages).toBe(Math.ceil(r.totalItems / 2));
	});
	it.each([{ modality: 'x' }, { status: 'x' }, { page: '0' }, { pageSize: '51' }, { sort: 'x' }])('rejects %j', async (q) => {
		await expect(svc.search(q)).rejects.toMatchObject({ code: 'INVALID_QUERY_PARAMETER' });
	});
});
