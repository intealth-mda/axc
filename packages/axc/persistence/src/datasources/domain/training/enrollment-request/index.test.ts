import { expect, it } from 'vitest';
import { MemoryStore } from '../../../store.ts';
import { EnrollmentRequestPersistence } from './index.ts';

it('composes an initialized enrollment unit of work', async () => {
	const store = new MemoryStore();
	const persistence = EnrollmentRequestPersistence(store);
	await persistence.EnrollmentRequestUnitOfWork.withScopedTransaction(async (repo) => {
		const request = await repo.getNewInstance({ id: 'c', status: 'active' } as never, 'a@example.org', 'x'.repeat(20));
		await repo.save(request);
	});
	expect(store.requests.size).toBe(1);
});
