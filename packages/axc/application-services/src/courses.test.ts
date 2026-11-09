import { courseSeed, InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { buildCourseServices } from './courses.ts';
import { ServiceError } from './service-error.ts';

const svc = buildCourseServices(new InMemoryCourseRepository(courseSeed));

describe('course search', () => {
	it('combines q, modality and status', async () => {
		const r = await svc.search({ q: 'SECURITY', modality: 'online', status: 'active' });
		expect(r.items.map((c) => c.id)).toEqual(['course-001']);
	});
	it.each([{ modality: 'x' }, { status: 'x' }, { page: '0' }, { page: 'a' }, { pageSize: '51' }, { sort: 'id' }])('rejects %o', async (q) => {
		await expect(svc.search(q)).rejects.toBeInstanceOf(ServiceError);
	});
});
