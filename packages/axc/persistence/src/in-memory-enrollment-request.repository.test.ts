import { Justification, LearnerEmail } from '@axc/domain';
import { describe, expect, it } from 'vitest';
import { InMemoryEnrollmentRequestRepository } from './in-memory-enrollment-request.repository.ts';

describe('InMemoryEnrollmentRequestRepository', () => {
	it('saves, gets and filters', async () => {
		const repo = new InMemoryEnrollmentRequestRepository();
		const j = new Justification('x'.repeat(30));
		await repo.save(repo.getNewInstance('e1', { courseId: 'c1', learnerEmail: new LearnerEmail('A@b.org'), justification: j }, 't'));
		await repo.save(repo.getNewInstance('e2', { courseId: 'c2', learnerEmail: new LearnerEmail('z@b.org'), justification: j }, 't'));
		expect((await repo.get('e1')).props.courseId).toBe('c1');
		expect((await repo.find({ learnerEmail: 'a@B.org' })).map((e) => e.id)).toEqual(['e1']);
		expect(await repo.find({ status: 'approved' })).toEqual([]);
		expect(await repo.find({})).toHaveLength(2);
		await expect(repo.get('nope')).rejects.toThrow(/not found/);
	});
});
