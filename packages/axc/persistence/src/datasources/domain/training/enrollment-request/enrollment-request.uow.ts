import type { EnrollmentRequest, EnrollmentRequestUnitOfWork, EnrollmentRequestRepository as RepositoryContract } from '@axc/domain';
import type { MemoryStore } from '../../../store.ts';
import { EnrollmentRequestConverter } from './enrollment-request.domain-adapter.ts';
import { EnrollmentRequestRepository } from './enrollment-request.repository.ts';
export const getEnrollmentRequestUnitOfWork = (store: MemoryStore): EnrollmentRequestUnitOfWork => {
	const withScopedTransaction = async (func: (repository: RepositoryContract) => Promise<void>): Promise<void> => {
		const previous = store.tail;
		let release: () => void = () => {
			/* Assigned synchronously by the Promise executor. */
		};
		store.tail = new Promise<void>((resolve) => {
			release = resolve;
		});
		await previous;
		const records = structuredClone(store.enrollments);
		try {
			await func(new EnrollmentRequestRepository(records, new EnrollmentRequestConverter()));
			store.enrollments = structuredClone(records);
		} finally {
			release();
		}
	};
	return {
		withScopedTransaction,
		withTransaction: (_passport, func) => withScopedTransaction(func),
		withScopedTransactionById: async (id, func) => {
			let result: EnrollmentRequest | undefined;
			await withScopedTransaction(async (repo) => {
				await func(repo);
				result = await repo.getById(id);
			});
			if (!result) throw new Error('Transaction did not produce a request.');
			return result;
		},
	};
};
