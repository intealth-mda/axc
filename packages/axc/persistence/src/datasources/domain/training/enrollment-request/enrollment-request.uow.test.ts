import { Domain } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { describe, expect, it } from 'vitest';
import { Persistence } from '../../../../index.ts';

const input = { courseId: 'course-001', learnerEmail: 'learner@example.org', justification: 'I need this course for my upcoming project.' };
describe('enrollment persistence', () => {
	it('commits creations and transitions and copies every nested history on reads and writes', async () => {
		const ds = Persistence().withSystemPassport();
		const uow = ds.domainDataSource.Training.EnrollmentRequest.EnrollmentRequestUnitOfWork;
		const read = ds.readonlyDataSource.Training.EnrollmentRequest.EnrollmentRequestReadRepo;
		let id = '';
		await uow.withScopedTransaction(async (repo) => {
			const r = await repo.getNewInstance(input);
			id = r.id;
			await repo.save(r);
			const entry0 = r.props.statusHistory[0];
			expect(entry0).toBeDefined();
			if (entry0) entry0.changedBy = 'mutated';
		});
		const found = await read.getById(id);
		expect(found?.statusHistory[0]?.changedBy).toBe('system');
		found?.statusHistory.push({ fromStatus: 'pending', toStatus: 'approved', changedAt: '', changedBy: 'mutated', reason: null });
		const result = await uow.withScopedTransactionById(id, async (repo) => {
			const r = await repo.get(id);
			r.updateStatus({ status: 'approved', changedBy: 'reviewer' });
			await repo.save(r);
		});
		const entry1 = result.props.statusHistory[0];
		expect(entry1).toBeDefined();
		if (entry1) entry1.changedBy = 'mutated';
		expect((await read.getById(id))?.statusHistory).toHaveLength(2);
		expect((await read.getById(id))?.statusHistory[0]?.changedBy).toBe('system');
		await expect(
			uow.withScopedTransaction(async (repo) => {
				await repo.get('missing');
			}),
		).rejects.toBeInstanceOf(NotFoundError);
	});
	it('rolls back thrown errors even after save and keeps the queue usable', async () => {
		const ds = Persistence().withSystemPassport();
		const uow = ds.domainDataSource.Training.EnrollmentRequest.EnrollmentRequestUnitOfWork;
		const read = ds.readonlyDataSource.Training.EnrollmentRequest.EnrollmentRequestReadRepo;
		await expect(
			uow.withScopedTransaction(async (repo) => {
				await repo.save(await repo.getNewInstance(input));
				throw new Domain.Contexts.Training.EnrollmentRequest.EnrollmentConflictError('INVALID_STATUS_TRANSITION');
			}),
		).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
		expect(await read.list({})).toEqual([]);
		await uow.withTransaction({ visa: {} }, async (repo) => {
			await repo.save(await repo.getNewInstance(input));
		});
		expect(await read.list({})).toHaveLength(1);
	});
	it('serializes concurrent duplicate checks across request scopes', async () => {
		const factory = Persistence();
		const attempt = () =>
			factory.withSystemPassport().domainDataSource.Training.EnrollmentRequest.EnrollmentRequestUnitOfWork.withScopedTransaction(async (repo) => {
				if (await repo.hasActive(input.courseId, input.learnerEmail)) throw new Domain.Contexts.Training.EnrollmentRequest.EnrollmentConflictError('DUPLICATE_ACTIVE_REQUEST');
				await repo.save(await repo.getNewInstance(input));
			});
		const results = await Promise.allSettled([attempt(), attempt(), attempt()]);
		expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
		expect(results.filter((r) => r.status === 'rejected')).toHaveLength(2);
		expect(await factory.withSystemPassport().readonlyDataSource.Training.EnrollmentRequest.EnrollmentRequestReadRepo.list({})).toHaveLength(1);
	});
	it('filters by each field and combined fields and permits new requests after terminal states', async () => {
		const ds = Persistence().withSystemPassport();
		const uow = ds.domainDataSource.Training.EnrollmentRequest.EnrollmentRequestUnitOfWork;
		const read = ds.readonlyDataSource.Training.EnrollmentRequest.EnrollmentRequestReadRepo;
		await uow.withScopedTransaction(async (repo) => {
			for (const [courseId, learnerEmail, status] of [
				['course-001', 'learner@example.org', 'pending'],
				['course-002', 'other@example.org', 'approved'],
				['course-001', 'other@example.org', 'rejected'],
			] as const) {
				const r = await repo.getNewInstance({ ...input, courseId, learnerEmail });
				if (status !== 'pending') r.updateStatus({ status, changedBy: 'reviewer', reason: 'Reason' });
				await repo.save(r);
			}
			expect(await repo.hasActive('course-001', ' LEARNER@EXAMPLE.ORG ')).toBe(true);
			expect(await repo.hasActive('course-002', 'other@example.org')).toBe(true);
			expect(await repo.hasActive('course-001', 'other@example.org')).toBe(false);
		});
		expect((await read.list({ status: 'pending' })).map((r) => r.learnerEmail)).toEqual(['learner@example.org']);
		expect(await read.list({ courseId: 'course-001' })).toHaveLength(2);
		expect(await read.list({ learnerEmail: 'OTHER@EXAMPLE.ORG' })).toHaveLength(2);
		expect((await read.list({ status: 'rejected', courseId: 'course-001', learnerEmail: 'other@example.org' })).map((r) => r.status)).toEqual(['rejected']);
		expect(await read.list({ courseId: 'missing' })).toEqual([]);
		const list = await read.list({});
		const entry2 = list[0]?.statusHistory[0];
		expect(entry2).toBeDefined();
		if (entry2) entry2.changedBy = 'mutated';
		expect((await read.list({}))[0]?.statusHistory[0]?.changedBy).toBe('system');
	});
});
