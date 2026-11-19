import { InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { courseService } from './courses.ts';

const svc = courseService(new InMemoryCourseRepository());

describe('course search', () => {
	it('filters, sorts and paginates', async () => {
		const r = await svc.search({ q: 'SECURITY', modality: 'online', status: 'active', tag: 'AI', pageSize: '5' });
		expect(r.items.map((c) => c.id)).toEqual(['course-001']);
		const all = await svc.search({ sort: 'createdAt', page: '2', pageSize: '5' });
		expect(all.items).toHaveLength(5);
		expect(all.totalPages).toBe(Math.ceil(all.totalItems / 5));
	});
	it.each([{ modality: 'x' }, { status: 'x' }, { page: '0' }, { pageSize: '51' }, { sort: 'id' }])('rejects %o', async (q) => {
		await expect(svc.search(q)).rejects.toMatchObject({ code: 'INVALID_QUERY_PARAMETER' });
	});
});
