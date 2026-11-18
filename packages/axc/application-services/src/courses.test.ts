import { describe, expect, it } from 'vitest';
import { buildCoursesService, ServiceError } from './courses.ts';

describe('courses service', () => {
	const svc = buildCoursesService();
	it('defaults page 1, pageSize 10, sorted by title', async () => {
		const r = await svc.search({});
		expect([r.page, r.pageSize, r.items.length]).toEqual([1, 10, 10]);
		expect(r.items.map((c) => c.title)).toEqual([...r.items.map((c) => c.title)].sort((a, b) => a.localeCompare(b)));
	});
	it('throws INVALID_QUERY_PARAMETER with every bad field', async () => {
		const e = await svc.search({ page: '0', pageSize: '51', modality: 'x', status: 'y', sort: 'z' }).catch((x: unknown) => x);
		expect(e).toBeInstanceOf(ServiceError);
		expect((e as ServiceError).details.map((d) => d.field)).toEqual(['page', 'pageSize', 'modality', 'status', 'sort']);
	});
});
