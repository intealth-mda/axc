import { expect, it } from 'vitest';
import type { MemoryStore } from '../../../store.ts';
import { getEnrollmentRequestUnitOfWork } from './enrollment-request.uow.ts';

const store = (): MemoryStore => ({ courses: new Map(), enrollments: new Map(), tail: Promise.resolve() });
it('commits atomically and rolls back saves on error', async () => {
	const memory = store();
	const uow = getEnrollmentRequestUnitOfWork(memory);
	let id = '';
	await uow.withTransaction(undefined, async (repo) => {
		const item = await repo.getNewInstance('c', 'a@b.org', 'x'.repeat(20));
		id = item.id;
		await repo.save(item);
		expect(memory.enrollments.size).toBe(0);
	});
	expect(memory.enrollments.get(id)?.statusHistory[0]?.toStatus).toBe('pending');
	const before = structuredClone(memory.enrollments);
	await expect(
		uow.withScopedTransaction(async (repo) => {
			const item = await repo.get(id);
			item.changeStatus('approved', 'reviewer', undefined, 'later');
			await repo.save(item);
			throw new Error('rollback');
		}),
	).rejects.toThrow('rollback');
	expect(memory.enrollments).toEqual(before);
	const result = await uow.withScopedTransactionById(id, async (repo) => {
		const item = await repo.get(id);
		item.changeStatus('cancelled', 'reviewer', undefined, 'later');
		await repo.save(item);
	});
	expect(result.status).toBe('cancelled');
	expect(memory.enrollments.get(id)?.status).toBe('cancelled');
});
it('serializes concurrent transactions so exactly one duplicate commits; later work still runs', async () => {
	const memory = store();
	const uow = getEnrollmentRequestUnitOfWork(memory);
	const results = await Promise.allSettled(
		Array.from({ length: 8 }, () =>
			uow.withScopedTransaction(async (repo) => {
				await repo.save(await repo.getNewInstance('c', 'a@b.org', 'x'.repeat(20)));
			}),
		),
	);
	expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
	expect(memory.enrollments.size).toBe(1);
	for (const result of results) if (result.status === 'rejected') expect(result.reason.code).toBe('DUPLICATE_ACTIVE_REQUEST');
	await uow.withScopedTransaction(async (repo) => {
		await repo.save(await repo.getNewInstance('c', 'other@b.org', 'x'.repeat(20)));
	});
	expect(memory.enrollments.size).toBe(2);
});
