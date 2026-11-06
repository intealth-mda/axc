import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type { Repository } from '@cellix/domain-seedwork/repository';
import { describe, expect, it } from 'vitest';
import { InMemoryUnitOfWork } from './in-memory-unit-of-work.ts';

interface CounterProps extends DomainEntityProps {
	value: number;
}
class Counter extends AggregateRoot<CounterProps, undefined> {}

const store = (): Repository<Counter> => {
	const items = new Map<string, Counter>([['c1', new Counter({ id: 'c1', value: 0 }, undefined)]]);
	return {
		get: (id) => {
			const item = items.get(id);
			return item ? Promise.resolve(item) : Promise.reject(new Error(`${id} not found`));
		},
		save: (item) => {
			items.set(item.id, item);
			return Promise.resolve(item);
		},
	};
};

describe('InMemoryUnitOfWork', () => {
	it('runs transactions one at a time, so a read-check-write never sees stale state', async () => {
		const uow = new InMemoryUnitOfWork(store());
		const claim = () =>
			uow.withScopedTransaction(async (repo) => {
				const counter = await repo.get('c1');
				const seen = counter.props.value;
				await Promise.resolve();
				if (seen !== 0) throw new Error('already claimed');
				counter.props.value = seen + 1;
				await repo.save(counter);
			});
		const results = await Promise.allSettled([claim(), claim()]);
		expect(results.map((r) => r.status)).toEqual(['fulfilled', 'rejected']);
	});

	it('withScopedTransactionById saves and returns the aggregate; a failed transaction does not block the next', async () => {
		const uow = new InMemoryUnitOfWork(store());
		await expect(uow.withScopedTransaction(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
		const saved = await uow.withScopedTransactionById('c1', async (repo) => {
			(await repo.get('c1')).props.value = 5;
		});
		expect(saved.props.value).toBe(5);
		await expect(uow.withScopedTransactionById('missing', () => Promise.resolve())).rejects.toThrow('missing not found');
	});
});
