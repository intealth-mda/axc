import { InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { buildCourseService } from './courses.ts';
import { ServiceError } from './service-error.ts';

const svc = buildCourseService(new InMemoryCourseRepository());

describe('searchCourses', () => {
	it('combines q, modality, status', async () => {
		const r = await svc.searchCourses({ q: 'SECURITY', modality: 'online', status: 'active' });
		expect(r.items.map((c) => c.id)).toEqual(['course-001', 'course-012']);
	});
	it('rejects bad params with details', async () => {
		const e = await svc.searchCourses({ pageSize: '51', sort: 'x' }).catch((x: unknown) => x);
		expect(e).toBeInstanceOf(ServiceError);
		expect((e as ServiceError).details.map((d) => d.field)).toEqual(['pageSize', 'sort']);
	});
});
