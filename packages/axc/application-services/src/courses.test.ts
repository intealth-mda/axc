import { courseSeed, InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { buildCoursesService, ServiceError } from './courses.ts';

const service = buildCoursesService(new InMemoryCourseRepository(courseSeed()));

describe('courses.search', () => {
	it('combines q, modality and status', async () => {
		const r = await service.search({ q: 'SECURITY', modality: 'online', status: 'active' });
		expect(r.items.map((c) => c.id)).toEqual(['course-001', 'course-006']);
	});
	it('collects every invalid field into one ServiceError', async () => {
		const err = await service.search({ modality: 'x', status: 'x', page: '0', pageSize: '51', sort: 'x' }).catch((e: unknown) => e);
		expect(err).toBeInstanceOf(ServiceError);
		expect((err as ServiceError).details.map((d) => d.field)).toEqual(['modality', 'status', 'page', 'pageSize', 'sort']);
	});
});
