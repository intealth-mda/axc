import { Justification, LearnerEmail } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { describe, expect, it } from 'vitest';
import { InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from './in-memory-repositories.ts';

describe('in-memory repositories', () => {
	it('seeds at least 12 courses of every status and modality', async () => {
		const courses = await new InMemoryCourseRepository().getAll();
		expect(courses.length).toBeGreaterThanOrEqual(12);
		expect(new Set(courses.map((c) => c.props.status))).toEqual(new Set(['active', 'draft', 'retired']));
		expect(new Set(courses.map((c) => c.props.modality))).toEqual(new Set(['online', 'in-person', 'hybrid']));
	});

	it('saves and reads enrollment requests', async () => {
		const repo = new InMemoryEnrollmentRequestRepository();
		const created = await repo.getNewInstance('e1', { courseId: 'c1', learnerEmail: new LearnerEmail('a@b.org'), justification: new Justification('x'.repeat(25)) }, 'now');
		await repo.save(created);
		expect(await repo.get('e1')).toBe(created);
		expect(await repo.getById('missing')).toBeUndefined();
		await expect(repo.get('missing')).rejects.toThrow(NotFoundError);
	});
});
