import { describe, expect, it } from 'vitest';
import { EnrollmentRequestUnitOfWorkImpl } from './enrollment-request.uow.ts';

describe('unit of work', () => {
	it('commits and rolls back', async () => {
		const records = new Map();
		const uow = new EnrollmentRequestUnitOfWorkImpl(records);
		const props = { id: 'e', courseId: 'c', learnerEmail: 'u@e.org', justification: 'This course supports my work.', createdAt: 'now' };
		await uow.withScopedTransaction(async (repo) => {
			await repo.save(await repo.getNewInstance(props));
		});
		expect(records.size).toBe(1);
		await expect(
			uow.withScopedTransaction(async (repo) => {
				const item = await repo.get('e');
				item.transition('approved', 'r', null, 'later');
				await repo.save(item);
				throw new Error('rollback');
			}),
		).rejects.toThrow('rollback');
		expect(records.get('e').status).toBe('pending');
	});
});
