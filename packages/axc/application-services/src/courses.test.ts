import { InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { buildCourseService } from './courses.ts';
import { ServiceError } from './service-error.ts';

const service = buildCourseService(new InMemoryCourseRepository());

describe('listCourses', () => {
	it('combines q, modality and status', async () => {
		const res = await service.listCourses({ q: 'SECURITY', modality: 'online', status: 'active' });
		expect(res.items.map((c) => c.id)).toEqual(['course-001']);
	});

	it('pages past the end with valid metadata', async () => {
		expect(await service.listCourses({ page: '3', pageSize: '5' })).toMatchObject({ page: 3, pageSize: 5, totalItems: 12, totalPages: 3 });
	});

	it.each([{ page: '0' }, { pageSize: '51' }, { pageSize: 'x' }, { sort: 'id' }, { modality: 'remote' }, { status: 'x' }])('rejects %o', async (query) => {
		await expect(service.listCourses(query)).rejects.toBeInstanceOf(ServiceError);
	});
});
