import { InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { courseService } from './courses.ts';

const svc = courseService(new InMemoryCourseRepository());

describe('courseService.search', () => {
	it('defaults, filters and sorts', async () => {
		const all = await svc.search({});
		expect([all.page, all.pageSize, all.items.length]).toEqual([1, 10, 10]);
		const r = await svc.search({ q: 'SECURITY', status: 'active', sort: 'createdAt' });
		expect(r.items.every((c) => c.status === 'active')).toBe(true);
		expect(r.items.map((c) => c.createdAt)).toEqual(r.items.map((c) => c.createdAt).sort());
		expect((await svc.search({ q: 'zzz' })).items).toEqual([]);
	});
	it.each([{ modality: 'x' }, { status: 'x' }, { page: '0' }, { pageSize: '51' }, { sort: 'x' }])('rejects %j', async (q) => {
		await expect(svc.search(q)).rejects.toMatchObject({ code: 'INVALID_QUERY_PARAMETER' });
	});
});
