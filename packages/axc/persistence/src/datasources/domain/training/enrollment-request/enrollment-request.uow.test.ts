import { describe, expect, it } from 'vitest';
import { MemoryStore } from '../../../store.ts';
import { getEnrollmentRequestUnitOfWork } from './enrollment-request.uow.ts';

describe('enrollment unit of work', () => {
	it('commits atomically, rolls back failures, and isolates held aggregates', async () => {
		const store = new MemoryStore();
		const uow = getEnrollmentRequestUnitOfWork(store);
		const course = { id: 'c', status: 'active' } as never;
		let id = '';
		let mutate = () => {
			/* initialized before use */
		};
		await uow.withTransaction(undefined, async (repo) => {
			const request = await repo.getNewInstance(course, 'a@example.org', 'x'.repeat(20));
			id = request.id;
			await repo.save(request);
			mutate = () => request.changeStatus('approved', 'r');
			expect(store.requests.size).toBe(0);
		});
		mutate();
		expect(store.requests.get(id)?.status).toBe('pending');
		await expect(
			uow.withScopedTransaction(async (repo) => {
				const request = await repo.get(id);
				request.changeStatus('approved', 'r');
				await repo.save(request);
				throw new Error('rollback');
			}),
		).rejects.toThrow('rollback');
		expect(store.requests.get(id)?.statusHistory).toHaveLength(1);
		const result = await uow.withScopedTransactionById(id, async (repo) => {
			const request = await repo.get(id);
			request.changeStatus('approved', 'r');
			await repo.save(request);
		});
		expect(result.status).toBe('approved');
		expect(store.requests.get(id)?.status).toBe('approved');
	});
	it('serializes racing duplicate submissions and continues after failures', async () => {
		const store = new MemoryStore();
		const uow = getEnrollmentRequestUnitOfWork(store);
		const submit = () =>
			uow.withScopedTransaction(async (repo) => {
				const request = await repo.getNewInstance({ id: 'c', status: 'active' } as never, 'a@example.org', 'x'.repeat(20));
				await repo.save(request);
			});
		const outcomes = await Promise.allSettled([submit(), submit(), submit()]);
		expect(outcomes.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
		expect(store.requests.size).toBe(1);
		await expect(uow.withScopedTransactionById('missing', () => Promise.resolve())).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
	});
});
