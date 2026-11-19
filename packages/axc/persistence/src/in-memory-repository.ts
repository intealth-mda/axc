import type { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { NotFoundError } from '@cellix/domain-seedwork/repository';

export class InMemoryRepository<T extends AggregateRoot<DomainEntityProps, undefined>> {
	readonly #items = new Map<string, T>();

	constructor(seed: readonly T[] = []) {
		for (const item of seed) this.#items.set(item.id, item);
	}

	get(id: string): Promise<T> {
		const item = this.#items.get(id);
		return item ? Promise.resolve(item) : Promise.reject(new NotFoundError(`${id} not found`));
	}
	getById(id: string): Promise<T | undefined> {
		return Promise.resolve(this.#items.get(id));
	}
	getAll(): Promise<T[]> {
		return Promise.resolve([...this.#items.values()]);
	}
	save(item: T): Promise<T> {
		this.#items.set(item.id, item);
		return Promise.resolve(item);
	}
}
