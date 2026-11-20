import { InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { createCoursesService } from './courses.ts';
import { ServiceError } from './service-error.ts';

const svc = createCoursesService(new InMemoryCourseRepository());

describe('courses service', () => {
	it('defaults page 1, size 10, sorted by title', async () => {
		const r = await svc.search({});
		expect([r.page, r.pageSize, r.items.length]).toEqual([1, 10, 10]);
		expect(r.items[0]?.title).toBe('Accessible Web Design');
	});
	it('collects every invalid field into one ServiceError', async () => {
		const err = await svc.search({ modality: 'x', status: 'y', page: '0', pageSize: '51', sort: 'z' }).catch((e: unknown) => e);
		expect(err).toBeInstanceOf(ServiceError);
		expect((err as ServiceError).details.map((d) => d.field)).toEqual(['modality', 'status', 'page', 'pageSize', 'sort']);
	});
});
