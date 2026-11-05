import { courseSeed, InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { courseService, ServiceError } from './courses.ts';

const svc = courseService(new InMemoryCourseRepository(courseSeed));

describe('courseService.search', () => {
	it('defaults to page 1, size 10, sorted by title', async () => {
		const r = await svc.search({});
		expect(r).toMatchObject({ page: 1, pageSize: 10, totalItems: 12, totalPages: 2 });
		const titles = r.items.map((c) => c.title);
		expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
	});

	it('combines q, modality and status', async () => {
		const r = await svc.search({ q: 'SECURITY', modality: 'online', status: 'active' });
		expect(r.items.map((c) => c.id)).toEqual(['course-001']);
	});

	it.each([{ modality: 'remote' }, { status: 'live' }, { page: '0' }, { page: 'x' }, { pageSize: '51' }, { sort: 'name' }])('rejects %o', async (q) => {
		await expect(svc.search(q)).rejects.toBeInstanceOf(ServiceError);
	});
});
