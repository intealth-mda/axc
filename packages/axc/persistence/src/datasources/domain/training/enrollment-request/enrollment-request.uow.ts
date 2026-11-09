import type { Domain } from '@axc/domain';
import { enrollmentRequestRepository } from './enrollment-request.repository.ts';

type E = Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequestProps;
type Repo = Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequestRepository<E>;
export const enrollmentRequestUnitOfWork = (store: Map<string, E>): Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequestUnitOfWork<E> => {
	let queue = Promise.resolve();
	const withTransaction = (passport: Domain.Contexts.Passport, func: (repository: Repo) => Promise<void>): Promise<void> => {
		const run = queue.then(async () => {
			const working = structuredClone(store);
			await func(enrollmentRequestRepository(working, passport));
			store.clear();
			for (const [id, props] of working) store.set(id, structuredClone(props));
		});
		queue = run.catch(() => undefined);
		return run;
	};
	const passport = { visa: {} };
	return {
		withTransaction,
		withScopedTransaction: (func) => withTransaction(passport, func),
		withScopedTransactionById: async (id, func) => {
			let result: Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequest<E> | undefined;
			await withTransaction(passport, async (repo) => {
				await func(repo);
				result = await repo.get(id);
			});
			return result as Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequest<E>;
		},
	};
};
