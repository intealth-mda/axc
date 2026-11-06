import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { Domain } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { expect } from 'vitest';
import { fixture, validInput } from '../../../test-support.ts';
import { create } from './create.ts';

const feature = await loadFeature(path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'features/create.feature'));
describeFeature(feature, ({ Scenario }) => {
	Scenario('create enforces its use case contract', ({ When, Then }) => {
		const f = fixture();
		const run = create(f.dataSources);
		let result: Awaited<ReturnType<typeof run>>;
		const failures: PromiseSettledResult<unknown>[] = [];
		const duplicates: PromiseSettledResult<unknown>[] = [];
		const resubmissions: string[] = [];
		let savedBefore = 0;
		let savedAfterDuplicates = 0;
		When('the use case is called directly', async () => {
			failures.push(...(await Promise.allSettled([run({ ...validInput, courseId: 'missing' })])));
			for (const status of ['draft', 'retired']) {
				f.setCourseStatus(status);
				failures.push(...(await Promise.allSettled([run(validInput)])));
			}
			f.setCourseStatus('active');
			failures.push(...(await Promise.allSettled([run({ ...validInput, learnerEmail: 'bad', justification: 'short' })])));
			savedBefore = f.saved;
			result = await run(validInput);
			for (const status of ['pending', 'approved'] as const) {
				const p = f.store.get(result.id);
				if (p) p.status = status;
				duplicates.push(...(await Promise.allSettled([run({ ...validInput, learnerEmail: ' Learner@Example.org ' })])));
			}
			savedAfterDuplicates = f.saved;
			for (const status of ['rejected', 'cancelled'] as const) {
				const p = f.store.get(result.id);
				if (p) p.status = status;
				resubmissions.push((await run(validInput)).status);
			}
		});
		Then('its successful results and failures obey the contract', () => {
			expect(failures).toEqual([
				{ status: 'rejected', reason: expect.any(NotFoundError) },
				{ status: 'rejected', reason: expect.objectContaining({ code: 'COURSE_NOT_ACTIVE' }) },
				{ status: 'rejected', reason: expect.objectContaining({ code: 'COURSE_NOT_ACTIVE' }) },
				{ status: 'rejected', reason: expect.any(Domain.Contexts.Training.EnrollmentRequest.EnrollmentValidationError) },
			]);
			expect(savedBefore).toBe(0);
			expect(savedAfterDuplicates).toBe(1);
			expect(result).toMatchObject({ id: 'enroll-001', status: 'pending' });
			expect(result.statusHistory).toHaveLength(1);
			expect(duplicates).toHaveLength(2);
			for (const failure of duplicates) expect(failure).toEqual({ status: 'rejected', reason: expect.objectContaining({ code: 'DUPLICATE_ACTIVE_REQUEST' }) });
			expect(resubmissions).toEqual(['pending', 'pending']);
		});
	});
});
