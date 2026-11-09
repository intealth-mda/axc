import { InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { courseServices } from './courses.ts';

const svc = courseServices(new InMemoryCourseRepository());

describe('course search', () => {
	it('defaults to page 1, size 10, sorted by title', async () => {
		const r = await svc.search({});
		expect(r).toMatchObject({ page: 1, pageSize: 10, totalItems: 12, totalPages: 2 });
		expect(r.items.map((c) => c.title)).toEqual(r.items.map((c) => c.title).sort((a, b) => a.localeCompare(b)));
	});
	it('combines q, modality, status and tag', async () => {
		const r = await svc.search({ q: 'SECURITY', modality: 'online', status: 'active', tag: 'AI' });
		expect(r.items.map((c) => c.id)).toEqual(['course-001']);
	});
	it.each([{ modality: 'x' }, { status: 'x' }, { page: '0' }, { pageSize: '51' }, { sort: 'id' }])('rejects %j', async (q) => {
		await expect(svc.search(q)).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
	});
});
