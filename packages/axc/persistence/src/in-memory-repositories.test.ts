import { Justification, LearnerEmail } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { describe, expect, it } from 'vitest';
import { InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from './in-memory-repositories.ts';

describe('in-memory repositories', () => {
	it('course repo is seeded with 12+ mixed courses', async () => {
		const all = await new InMemoryCourseRepository().getAll();
		expect(all.length).toBeGreaterThanOrEqual(12);
		expect(new Set(all.map((c) => c.props.modality)).size).toBe(3);
		expect(new Set(all.map((c) => c.props.status)).size).toBe(3);
	});
	it('enrollment repo saves and gets', async () => {
		const repo = new InMemoryEnrollmentRequestRepository();
		await expect(repo.get('x')).rejects.toThrow(NotFoundError);
		const e = repo.getNewInstance('e1', { courseId: 'c', learnerEmail: new LearnerEmail('a@b.co'), justification: new Justification('x'.repeat(20)) }, 't');
		await repo.save(e);
		expect(await repo.getById('e1')).toBe(e);
		expect(await repo.getAll()).toHaveLength(1);
	});
});
