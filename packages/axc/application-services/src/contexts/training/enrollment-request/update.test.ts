import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { Domain } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { expect } from 'vitest';
import { fixture, validInput } from '../../../test-support.ts';
import { update } from './update.ts';

const feature = await loadFeature(path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'features/update.feature'));
describeFeature(feature, ({ Scenario }) => {
	Scenario('update enforces its use case contract', ({ When, Then }) => {
		const f = fixture();
		const props = Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequest.getNewInstance({ id: 'enroll-001' } as Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequestProps, { visa: {} }, validInput).props;
		f.store.set(props.id, props);
		const run = update(f.dataSources);
		let missing: PromiseSettledResult<unknown>[];
		let invalid: PromiseSettledResult<unknown>[];
		let conflict: PromiseSettledResult<unknown>[];
		let approved: Awaited<ReturnType<typeof run>>;
		let cancelled: Awaited<ReturnType<typeof run>>;
		let savedBefore = 0;
		let savedAfterConflict = 0;
		let afterConflict: unknown;
		When('the use case is called directly', async () => {
			missing = await Promise.allSettled([run('missing', { status: 'approved', changedBy: 'reviewer' })]);
			invalid = await Promise.allSettled(
				[
					{ status: 'bad', changedBy: 'reviewer' },
					{ status: 'rejected', changedBy: 'reviewer' },
					{ status: 'approved', changedBy: '' },
				].map((input) => run(props.id, input)),
			);
			savedBefore = f.saved;
			approved = await run(props.id, { status: 'approved', changedBy: 'reviewer' });
			conflict = await Promise.allSettled([run(props.id, { status: 'rejected', changedBy: 'reviewer', reason: 'Reason' })]);
			savedAfterConflict = f.saved;
			afterConflict = structuredClone(f.store.get(props.id));
			cancelled = await run(props.id, { status: 'cancelled', changedBy: 'reviewer' });
		});
		Then('its successful results and failures obey the contract', () => {
			expect(missing).toEqual([{ status: 'rejected', reason: expect.any(NotFoundError) }]);
			expect(invalid).toHaveLength(3);
			for (const failure of invalid) expect(failure).toEqual({ status: 'rejected', reason: expect.any(Domain.Contexts.Training.EnrollmentRequest.EnrollmentValidationError) });
			expect(savedBefore).toBe(0);
			expect(savedAfterConflict).toBe(1);
			expect(approved.statusHistory).toHaveLength(2);
			expect(cancelled.statusHistory).toHaveLength(3);
			expect(conflict).toEqual([{ status: 'rejected', reason: expect.objectContaining({ code: 'INVALID_STATUS_TRANSITION' }) }]);
			expect(afterConflict).toEqual(approved);
		});
	});
});
