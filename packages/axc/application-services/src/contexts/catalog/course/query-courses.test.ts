import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { expect, vi } from 'vitest';
import { queryCourses } from './query-courses.ts';

const feature = await loadFeature(path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'features/query-courses.feature'));
describeFeature(feature, ({ Scenario }) => {
	const page = { items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 };
	const search = vi.fn(() => Promise.resolve(page));
	const sources: DataSources = { readonlyDataSource: { Catalog: { Course: { CourseReadRepo: { search } } } } };
	Scenario('Valid queries reach the read repository', ({ Given, When, Then }) => {
		let result: unknown;
		Given('a course read repository', () => {
			search.mockClear();
		});
		When('a valid search is submitted', async () => {
			result = await queryCourses(sources)({ page: 1, pageSize: 10, sort: 'title' });
		});
		Then('the matching page is returned', () => {
			expect(result).toBe(page);
			expect(search).toHaveBeenCalledExactlyOnceWith({ page: 1, pageSize: 10, sort: 'title' });
		});
	});
	Scenario('Invalid queries never reach the read repository', ({ Given, When, Then }) => {
		let failure: unknown;
		Given('a course read repository', () => {
			search.mockClear();
		});
		When('an invalid search is submitted', async () => {
			try {
				await queryCourses(sources)({ page: 0, pageSize: 10, sort: 'title' });
			} catch (error) {
				failure = error;
			}
		});
		Then('validation fails before reading', () => {
			expect(failure).toBeInstanceOf(Domain.Contexts.Catalog.Course.CourseValidationError);
			expect(search).not.toHaveBeenCalled();
		});
	});
});
