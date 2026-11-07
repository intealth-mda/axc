import { describe, expect, it } from 'vitest';
import { EnrollmentRequestConverter } from './enrollment-request.domain-adapter.ts';
import { EnrollmentRequestRepositoryImpl } from './enrollment-request.repository.ts';

describe('repository', () => {
	it('creates, saves, and retrieves through converter', async () => {
		const repo = new EnrollmentRequestRepositoryImpl(new Map(), new EnrollmentRequestConverter());
		const created = await repo.getNewInstance({ id: 'e', courseId: 'c', learnerEmail: 'u@e.org', justification: 'This course supports my work.', createdAt: 'now' });
		await repo.save(created);
		expect((await repo.get('e')).toReference()).toEqual(created.toReference());
	});
});
