import { Justification, LearnerEmail } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { describe, expect, it } from 'vitest';
import { InMemoryEnrollmentRequestRepository } from './in-memory-enrollment-request.repository.ts';

describe('InMemoryEnrollmentRequestRepository', () => {
	it('saves, gets and filters', async () => {
		const repo = new InMemoryEnrollmentRequestRepository();
		const j = new Justification('x'.repeat(25));
		await repo.save(repo.getNewInstance('a', { courseId: 'c1', learnerEmail: new LearnerEmail('A@b.org'), justification: j }, 't'));
		await repo.save(repo.getNewInstance('b', { courseId: 'c2', learnerEmail: new LearnerEmail('z@b.org'), justification: j }, 't'));
		expect((await repo.get('a')).props.courseId).toBe('c1');
		await expect(repo.get('nope')).rejects.toThrow(NotFoundError);
		expect((await repo.find({ learnerEmail: 'a@B.org' })).map((r) => r.id)).toEqual(['a']);
		expect((await repo.find({ courseId: 'c2', status: 'pending' })).map((r) => r.id)).toEqual(['b']);
		expect(await repo.find({ status: 'approved' })).toEqual([]);
	});
});
