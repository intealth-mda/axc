import type { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type { Repository } from '@cellix/domain-seedwork/repository';
import type { InitializedUnitOfWork } from '@cellix/domain-seedwork/unit-of-work';

/**
 * In-memory stand-in for the CellixJS Mongo unit of work (same contract, same
 * withScopedTransactionById semantics). Transactions run one at a time, so a
 * read-check-save cannot interleave with another request's.
 */
// ponytail: one queue per unit of work, no rollback (in-memory saves apply as made); Mongo gets both from mongoose-seedwork.
export class InMemoryUnitOfWork<Root extends AggregateRoot<DomainEntityProps, unknown>, Repo extends Repository<Root>> implements InitializedUnitOfWork<unknown, DomainEntityProps, Root, Repo> {
	readonly #repository: Repo;
	#tail: Promise<unknown> = Promise.resolve();

	constructor(repository: Repo & Repository<Root>) {
		this.#repository = repository;
	}

	withTransaction(_passport: unknown, func: (repository: Repo) => Promise<void>): Promise<void> {
		return this.withScopedTransaction(func);
	}

	withScopedTransaction(func: (repository: Repo) => Promise<void>): Promise<void> {
		return this.#run(() => func(this.#repository));
	}

	withScopedTransactionById(id: string, func: (repository: Repo) => Promise<void>): Promise<Root> {
		return this.#run(async () => {
			const item = await this.#repository.get(id);
			await func(this.#repository);
			return this.#repository.save(item);
		});
	}

	#run<T>(work: () => Promise<T>): Promise<T> {
		const result = this.#tail.then(work);
		this.#tail = result.catch(() => undefined);
		return result;
	}
}
