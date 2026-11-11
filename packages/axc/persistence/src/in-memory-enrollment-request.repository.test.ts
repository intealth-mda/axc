import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { describe, expect, it } from 'vitest';
import { InMemoryEnrollmentRequestRepository } from './in-memory-enrollment-request.repository.ts';

describe('InMemoryEnrollmentRequestRepository', () => {
	it('saves, gets and filters', async () => {
		const repo = new InMemoryEnrollmentRequestRepository();
		const j = 'I need this course for my upcoming work.';
		await repo.save(repo.getNewInstance('e1', { courseId: 'c1', learnerEmail: 'A@b.org', justification: j }, 't'));
		await repo.save(repo.getNewInstance('e2', { courseId: 'c2', learnerEmail: 'x@b.org', justification: j }, 't'));
		expect((await repo.get('e1')).props.courseId).toBe('c1');
		expect((await repo.find({ learnerEmail: 'a@b.org' })).map((e) => e.id)).toEqual(['e1']);
		expect((await repo.find({ courseId: 'c2', status: 'pending' })).map((e) => e.id)).toEqual(['e2']);
		expect(await repo.find({ status: 'approved' })).toEqual([]);
		await expect(repo.get('nope')).rejects.toThrow(NotFoundError);
	});
});
