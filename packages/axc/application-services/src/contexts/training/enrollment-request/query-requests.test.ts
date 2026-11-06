import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { Domain } from '@axc/domain';
import { expect } from 'vitest';
import { fixture } from '../../../test-support.ts';
import { queryRequests } from './query-requests.ts';

const feature = await loadFeature(path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'features/query-requests.feature'));
describeFeature(feature, ({ Scenario }) => {
	Scenario('query-requests enforces its use case contract', ({ When, Then }) => {
		const f = fixture();
		const filter = { status: 'pending', courseId: 'course-001', learnerEmail: 'learner@example.org' };
		let result: unknown;
		let invalid: PromiseSettledResult<unknown>[];
		When('the use case is called directly', async () => {
			result = await queryRequests(f.dataSources)(filter);
			invalid = await Promise.allSettled([{ status: '' }, { courseId: '' }, { learnerEmail: 'bad' }].map((input) => queryRequests(f.dataSources)(input)));
		});
		Then('its successful results and failures obey the contract', () => {
			expect(result).toEqual([]);
			expect(f.reads).toEqual([filter]);
			expect(invalid).toHaveLength(3);
			for (const failure of invalid) expect(failure).toEqual({ status: 'rejected', reason: expect.any(Domain.Contexts.Training.EnrollmentRequest.EnrollmentValidationError) });
		});
	});
});
