import { describe, expect, it } from 'vitest';
import { InMemoryEnrollmentRequestRepository } from './in-memory-enrollment-request-repository.ts';

describe('InMemoryEnrollmentRequestRepository', () => {
	it('saves and filters', async () => {
		const repo = new InMemoryEnrollmentRequestRepository();
		await repo.save(repo.getNewInstance('a', { courseId: 'c1', learnerEmail: 'A@b.co', justification: 'x'.repeat(20) }, 't'));
		await repo.save(repo.getNewInstance('b', { courseId: 'c2', learnerEmail: 'z@b.co', justification: 'x'.repeat(20) }, 't'));
		expect((await repo.find({ learnerEmail: 'a@b.co' })).map((r) => r.id)).toEqual(['a']);
		expect((await repo.find({ courseId: 'c2', status: 'pending' })).map((r) => r.id)).toEqual(['b']);
		expect(await repo.getById('none')).toBeUndefined();
	});
});
