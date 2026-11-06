import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { expect, vi } from 'vitest';
import { queryCourses } from './query-courses.ts';

const feature = await loadFeature(path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'features/query-courses.feature'));
const page = { items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 };
const search = vi.fn().mockResolvedValue(page);
const dataSources: DataSources = { readonlyDataSource: { Catalog: { Course: { CourseReadRepo: { search } } } } };
describeFeature(feature, ({ Scenario }) => {
	Scenario('Valid searches read through the injected repository', ({ When, Then }) => {
		let result: unknown;
		When('a valid course search is submitted', async () => {
			search.mockClear();
			result = await queryCourses(dataSources)({ page: 1, pageSize: 10, sort: 'title' });
		});
		Then('the repository result is returned', () => {
			expect(result).toBe(page);
			expect(search).toHaveBeenCalledExactlyOnceWith({ page: 1, pageSize: 10, sort: 'title' });
		});
	});
	Scenario('Invalid searches fail before reading', ({ When, Then }) => {
		let error: unknown;
		When('an invalid course search is submitted', async () => {
			search.mockClear();
			try {
				await queryCourses(dataSources)({ q: ' ', tag: '', page: Infinity, pageSize: 51, sort: 'bad', modality: 'bad', status: 'bad' });
			} catch (caught) {
				error = caught;
			}
		});
		Then('every validation problem is reported without reading', () => {
			expect(error).toBeInstanceOf(Domain.Contexts.Catalog.Course.CourseValidationError);
			expect((error as Domain.Contexts.Catalog.Course.CourseValidationError).details.map((d) => d.field).sort()).toEqual(['modality', 'page', 'pageSize', 'q', 'sort', 'status', 'tag']);
			expect(search).not.toHaveBeenCalled();
		});
	});
});
