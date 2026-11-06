import type { EnrollmentRequest, EnrollmentRequestRepository as Repository, EnrollmentRequestUnitOfWork as UnitOfWork } from '@axc/domain';
import type { MemoryStore } from '../../../store.ts';
import { EnrollmentRequestConverter } from './enrollment-request.domain-adapter.ts';
import { EnrollmentRequestRepository } from './enrollment-request.repository.ts';
export const getEnrollmentRequestUnitOfWork = (store: MemoryStore): UnitOfWork => {
	const withScopedTransaction = (work: (repository: Repository) => Promise<void>) => store.transaction((records) => work(new EnrollmentRequestRepository(records, new EnrollmentRequestConverter())));
	return {
		withScopedTransaction,
		withTransaction: (_passport, work) => withScopedTransaction(work),
		withScopedTransactionById: async (id, work) => {
			let result: EnrollmentRequest | undefined;
			await withScopedTransaction(async (repository) => {
				await work(repository);
				result = await repository.get(id);
			});
			if (!result) throw new Error('Transaction returned no result.');
			return result;
		},
	};
};
