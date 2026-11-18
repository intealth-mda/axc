import { courseSeed, InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { coursesService, ServiceError } from './courses.ts';

const svc = coursesService(new InMemoryCourseRepository(courseSeed));

describe('coursesService.search', () => {
	it('defaults and combines filters', async () => {
		const all = await svc.search({});
		expect(all).toMatchObject({ page: 1, pageSize: 10, totalItems: 12, totalPages: 2 });
		const r = await svc.search({ q: 'SECURITY', modality: 'online', status: 'active' });
		expect(r.items.map((c) => c.id)).toEqual(['course-001', 'course-009']);
	});
	it('throws ServiceError listing every invalid field', async () => {
		const err = await svc.search({ page: '0', pageSize: '51', modality: 'x', status: 'y', sort: 'z' }).catch((e: unknown) => e);
		expect(err).toBeInstanceOf(ServiceError);
		expect((err as ServiceError).details.map((d) => d.field)).toEqual(['page', 'pageSize', 'modality', 'status', 'sort']);
	});
});
