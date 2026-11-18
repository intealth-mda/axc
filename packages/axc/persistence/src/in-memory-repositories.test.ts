import { describe, expect, it } from 'vitest';
import { courseSeed } from './course.seed.ts';
import { InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from './in-memory-repositories.ts';

describe('in-memory repositories', () => {
	it('loads the course seed and rejects unknown ids', async () => {
		const repo = new InMemoryCourseRepository(courseSeed);
		expect((await repo.getAll()).length).toBeGreaterThanOrEqual(12);
		await expect(repo.get('missing')).rejects.toThrow('not found');
		expect(await repo.getById('missing')).toBeUndefined();
	});
	it('filters enrollment requests', async () => {
		const repo = new InMemoryEnrollmentRequestRepository();
		await repo.save(repo.getNewInstance('e1', { courseId: 'c1', learnerEmail: 'A@b.org', justification: 'x'.repeat(20) }, 't'));
		await repo.save(repo.getNewInstance('e2', { courseId: 'c2', learnerEmail: 'z@b.org', justification: 'x'.repeat(20) }, 't'));
		expect((await repo.find({ learnerEmail: 'a@b.org' })).map((r) => r.id)).toEqual(['e1']);
		expect((await repo.find({ courseId: 'c2', status: 'pending' })).map((r) => r.id)).toEqual(['e2']);
		expect(await repo.find({ status: 'approved' })).toEqual([]);
	});
});
