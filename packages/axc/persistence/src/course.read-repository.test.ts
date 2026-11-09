import { describe, expect, it } from 'vitest';
import { createFixtureDataSourcesFactory } from './index.ts';

const repo = createFixtureDataSourcesFactory().create().readonlyDataSource.Catalog.Course.CourseReadRepo;
const ids = (items: { id: string }[]) => items.map((c) => c.id);
const defaults = { page: 1, pageSize: 50, sort: 'title' as const };
describe('fixture Course read repository', () => {
	it.each([
		[{ q: 'SECURITY' }, ['001', '002', '004', '005']],
		[{ modality: 'online' }, ['001', '002', '003', '005', '010']],
		[{ status: 'active' }, ['001', '002', '003', '004', '006', '011', '012']],
		[{ tag: 'AI' }, ['001', '004', '007']],
		[{ q: 'security', modality: 'online', status: 'active' }, ['001', '002']],
		[{ tag: 'cloud', status: 'active' }, ['002', '011']],
	] as const)('filters independently and in combination %j', async (query, expected) => {
		const result = await repo.search({ ...defaults, ...query });
		expect(ids(result.items)).toEqual(expected.map((n) => `course-${n}`));
		expect(result.totalItems).toBe(expected.length);
	});
	it('sorts by every supported field before pagination', async () => {
		for (const sort of ['title', 'createdAt', 'updatedAt'] as const) {
			const all = await repo.search({ ...defaults, sort });
			const expected = sort === 'createdAt' ? Array.from({ length: 12 }, (_, i) => `course-${String(12 - i).padStart(3, '0')}`) : Array.from({ length: 12 }, (_, i) => `course-${String(i + 1).padStart(3, '0')}`);
			expect(ids(all.items)).toEqual(expected);
			expect(ids((await repo.search({ ...defaults, sort, page: 2, pageSize: 5 })).items)).toEqual(expected.slice(5, 10));
		}
	});
	it('returns total for empty and beyond-last pages', async () => {
		expect(await repo.search({ ...defaults, q: 'no-match' })).toEqual({ items: [], totalItems: 0 });
		expect(await repo.search({ ...defaults, page: 100 })).toEqual({ items: [], totalItems: 12 });
	});
});
