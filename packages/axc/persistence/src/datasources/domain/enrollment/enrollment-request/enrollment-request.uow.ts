import type { EnrollmentRequestRecord } from '@axc/data-sources-mongoose-models';
import type { Enrollment } from '@axc/domain';
import { EnrollmentRequestConverter } from './enrollment-request.domain-adapter.ts';
import { EnrollmentRequestRepositoryImpl } from './enrollment-request.repository.ts';
export class EnrollmentRequestUnitOfWorkImpl implements Enrollment.InitializedEnrollmentRequestUnitOfWork {
	private queue: Promise<void> = Promise.resolve();
	private readonly records: Map<string, EnrollmentRequestRecord>;
	constructor(records: Map<string, EnrollmentRequestRecord>) {
		this.records = records;
	}
	withTransaction(_passport: undefined, func: (repo: Enrollment.EnrollmentRequestRepository) => Promise<void>): Promise<void> {
		return this.withScopedTransaction(func);
	}
	async withScopedTransaction(func: (repo: Enrollment.EnrollmentRequestRepository) => Promise<void>): Promise<void> {
		const previous = this.queue;
		let release: (() => void) | undefined;
		this.queue = new Promise<void>((resolve) => {
			release = resolve;
		});
		await previous;
		const working = new Map([...this.records].map(([key, value]) => [key, structuredClone(value)] as const));
		try {
			await func(new EnrollmentRequestRepositoryImpl(working, new EnrollmentRequestConverter()));
			this.records.clear();
			for (const [key, value] of working) this.records.set(key, value);
		} finally {
			release?.();
		}
	}
	async withScopedTransactionById(id: string, func: (repo: Enrollment.EnrollmentRequestRepository) => Promise<void>): Promise<Enrollment.EnrollmentRequest> {
		let result: Enrollment.EnrollmentRequest | undefined;
		await this.withScopedTransaction(async (repo) => {
			await func(repo);
			result = await repo.get(id);
		});
		if (!result) throw new Error('ENROLLMENT_REQUEST_NOT_FOUND');
		return result;
	}
}
