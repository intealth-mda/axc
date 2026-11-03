import { InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { courseSearch, InvalidQueryError } from './courses.ts';

const svc = courseSearch(new InMemoryCourseRepository());

describe('courseSearch', () => {
	it('applies defaults', async () => {
		const r = await svc.search({});
		expect([r.page, r.pageSize, r.items.length, r.totalItems]).toEqual([1, 10, 10, 12]);
	});
	it('collects every invalid field', async () => {
		const err = await svc.search({ page: '0', pageSize: '51', sort: 'x', modality: 'x', status: 'x', foo: '1' }).catch((e: unknown) => e);
		expect(err).toBeInstanceOf(InvalidQueryError);
		expect((err as InvalidQueryError).details.map((d) => d.field).sort()).toEqual(['foo', 'modality', 'page', 'pageSize', 'sort', 'status']);
	});
});
