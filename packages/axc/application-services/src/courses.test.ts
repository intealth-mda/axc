import { courseSeed, InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { buildCoursesService, ServiceError } from './courses.ts';

const service = buildCoursesService(new InMemoryCourseRepository(courseSeed));

describe('courses.list', () => {
	it('applies defaults and title sort', async () => {
		const res = await service.list({});
		expect([res.page, res.pageSize, res.totalItems, res.totalPages, res.items.length]).toEqual([1, 10, 12, 2, 10]);
		expect(res.items[0]?.title).toBe('Accessible Web Design');
	});
	it('combines q, modality and status', async () => {
		const res = await service.list({ q: 'SECURITY', modality: 'online', status: 'active' });
		expect(res.items.map((c) => c.id)).toEqual(['course-001', 'course-011']);
	});
	it.each([{ page: '0' }, { pageSize: '51' }, { modality: 'remote' }, { status: 'x' }, { sort: 'id' }, { page: 'a' }])('rejects %o', async (query) => {
		await expect(service.list(query)).rejects.toBeInstanceOf(ServiceError);
	});
});
