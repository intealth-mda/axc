import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { Domain } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { expect } from 'vitest';
import { fixture, validInput } from '../../../test-support.ts';
import { getById } from './get-by-id.ts';

const feature = await loadFeature(path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'features/get-by-id.feature'));
describeFeature(feature, ({ Scenario }) => {
	Scenario('get-by-id enforces its use case contract', ({ When, Then }) => {
		const f = fixture();
		const props = Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequest.getNewInstance({ id: 'enroll-001' } as Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequestProps, { visa: {} }, validInput).props;
		f.store.set(props.id, props);
		let results: PromiseSettledResult<unknown>[];
		When('the use case is called directly', async () => {
			results = await Promise.allSettled([getById(f.dataSources)(props.id), getById(f.dataSources)('missing')]);
		});
		Then('its successful results and failures obey the contract', () => {
			expect(results).toEqual([
				{ status: 'fulfilled', value: props },
				{ status: 'rejected', reason: expect.any(NotFoundError) },
			]);
		});
	});
});
