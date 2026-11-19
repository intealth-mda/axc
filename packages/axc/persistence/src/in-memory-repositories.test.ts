import { Justification, LearnerEmail } from '@axc/domain';
import { describe, expect, it } from 'vitest';
import { courseSeed } from './course-seed.ts';
import { InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from './in-memory-repositories.ts';

describe('in-memory repositories', () => {
	it('seeds courses', async () => {
		const repo = new InMemoryCourseRepository(courseSeed);
		expect((await repo.getAll()).length).toBeGreaterThanOrEqual(12);
		expect((await repo.get('course-001')).props.title).toBeTruthy();
		await expect(repo.get('nope')).rejects.toThrow('Not found');
	});
	it('saves enrollment requests', async () => {
		const repo = new InMemoryEnrollmentRequestRepository();
		const r = repo.getNewInstance('e1', 'c1', new LearnerEmail('a@b.org'), new Justification('x'.repeat(20)), 't');
		await repo.save(r);
		expect(await repo.getById('e1')).toBe(r);
	});
});
