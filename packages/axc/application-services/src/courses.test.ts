import { InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { buildCourseService } from './courses.ts';
import { ServiceError } from './service-error.ts';

const service = buildCourseService(new InMemoryCourseRepository());

describe('course search', () => {
	it('defaults to page 1, pageSize 10, sorted by title', async () => {
		const r = await service.search({});
		expect([r.page, r.pageSize, r.totalItems, r.totalPages, r.items.length]).toEqual([1, 10, 12, 2, 10]);
		const titles = r.items.map((c) => c.title);
		expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
	});

	it('combines filters', async () => {
		const r = await service.search({ q: 'SECURITY', status: 'active', modality: 'online', tag: 'AI' });
		expect(r.items.map((c) => c.id)).toEqual(['course-001']);
	});

	it.each([{ page: '0' }, { pageSize: '51' }, { sort: 'price' }, { modality: 'remote' }, { status: 'open' }, { page: 'x' }])('rejects %o', async (query) => {
		await expect(service.search(query)).rejects.toMatchObject({ code: 'INVALID_QUERY_PARAMETER' });
		await expect(service.search(query)).rejects.toBeInstanceOf(ServiceError);
	});
});
