import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { DataSources } from '@axc/persistence';
import { expect, vi } from 'vitest';
import { queryCourses } from './query-courses.ts';

const feature = await loadFeature(path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'features/query-courses.feature'));
const query = { page: 1, pageSize: 10, sort: 'title' };
const result = { items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 };
describeFeature(feature, ({ Scenario }) => {
	Scenario('Delegating a valid search to the read repository', ({ Given, When, Then }) => {
		const search = vi.fn(async () => result);
		const sources: DataSources = { readonlyDataSource: { Catalog: { Course: { CourseReadRepo: { search } } } } };
		let actual: unknown;
		Given('a course read repository', () => {
			search.mockClear();
		});
		When('a valid catalog search is requested', async () => {
			actual = await queryCourses(sources)(query);
		});
		Then('the repository receives the query and its result is returned', () => {
			expect(search).toHaveBeenCalledExactlyOnceWith(query);
			expect(actual).toBe(result);
		});
	});
	Scenario('Rejecting invalid searches before accessing storage', ({ Given, When, Then }) => {
		const search = vi.fn(async () => result);
		const sources: DataSources = { readonlyDataSource: { Catalog: { Course: { CourseReadRepo: { search } } } } };
		Given('a course read repository', () => {
			search.mockClear();
		});
		When('invalid catalog searches are requested', async () => {
			for (const invalid of [{ page: 0 }, { page: Infinity }, { page: 1.5 }, { pageSize: 51 }, { pageSize: 0 }, { sort: 'bad' }, { modality: 'bad' }, { status: 'bad' }, { tag: '' }, { q: ' ' }]) {
				await expect(queryCourses(sources)({ ...query, ...invalid })).rejects.toThrow('Invalid course search query');
			}
		});
		Then('every invalid search is rejected without a repository call', () => {
			expect(search).not.toHaveBeenCalled();
		});
	});
});
