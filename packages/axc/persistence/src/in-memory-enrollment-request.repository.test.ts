import { describe, expect, it } from 'vitest';
import { InMemoryEnrollmentRequestRepository } from './in-memory-enrollment-request.repository.ts';

describe('InMemoryEnrollmentRequestRepository', () => {
	it('saves, gets and filters', async () => {
		const repo = new InMemoryEnrollmentRequestRepository();
		await repo.save(repo.getNewInstance('e1', { courseId: 'c1', learnerEmail: 'A@b.org', justification: 'x'.repeat(20) }, 't'));
		expect((await repo.get('e1')).id).toBe('e1');
		expect(await repo.find({ learnerEmail: 'a@b.org', status: 'pending' })).toHaveLength(1);
		expect(await repo.find({ courseId: 'c2' })).toHaveLength(0);
		await expect(repo.get('x')).rejects.toThrow('not found');
	});
});
