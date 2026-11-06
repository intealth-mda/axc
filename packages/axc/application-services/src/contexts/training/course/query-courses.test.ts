import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { Domain } from '@axc/domain';
import { expect } from 'vitest';
import { fixture } from '../../../test-support.ts';
import { queryCourses } from './query-courses.ts';

const feature = await loadFeature(path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'features/query-courses.feature'));
describeFeature(feature, ({ Scenario }) => {
	Scenario('query-courses enforces its use case contract', ({ When, Then }) => {
		const f = fixture();
		let result: unknown;
		let invalid: PromiseSettledResult<unknown>[];

		When('the use case is called directly', async () => {
			result = await queryCourses(f.dataSources)({ page: 1, pageSize: 10, sort: 'title' });
			invalid = await Promise.allSettled([queryCourses(f.dataSources)({ page: 0, pageSize: 99, sort: 'bad' })]);
		});
		Then('its successful results and failures obey the contract', () => {
			expect(result).toMatchObject({ page: 1, pageSize: 10 });
			expect(f.reads).toEqual([{ page: 1, pageSize: 10, sort: 'title' }]);
			expect(invalid).toEqual([{ status: 'rejected', reason: expect.any(Domain.Contexts.Training.Course.CourseValidationError) }]);
		});
	});
});
