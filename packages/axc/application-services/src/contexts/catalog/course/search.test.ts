import type { DataSources } from '@axc/persistence';
import { describe, expect, it, vi } from 'vitest';
import { search } from './search.ts';

const repositorySearch = vi.fn().mockResolvedValue({ items: [], totalItems: 0 });
const dataSources: DataSources = { readonlyDataSource: { Catalog: { Course: { CourseReadRepo: { search: repositorySearch } } } } };
describe('course application search', () => {
	it('uses injected readonly repository and default public pagination', async () => {
		expect(await search(dataSources)({})).toEqual({ items: [], totalItems: 0, totalPages: 0, page: 1, pageSize: 10 });
		expect(repositorySearch).toHaveBeenLastCalledWith({ page: 1, pageSize: 10, sort: 'title' });
	});
	it.each([
		{ modality: 'bad' },
		{ status: 'bad' },
		{ q: 12 },
		{ tag: [] },
		{ page: 0 },
		{ page: 1.2 },
		{ pageSize: 51 },
		{ sort: 'bad' },
		{ unknown: 'bad' },
	])('validates direct runtime query %j before storage access', async (query) => {
		repositorySearch.mockClear();
		await expect(search(dataSources)(query as never)).rejects.toMatchObject({ code: 'INVALID_QUERY_PARAMETER', details: expect.any(Array) });
		expect(repositorySearch).not.toHaveBeenCalled();
	});
});
