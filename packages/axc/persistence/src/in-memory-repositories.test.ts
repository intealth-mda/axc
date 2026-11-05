import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { describe, expect, it } from 'vitest';
import { InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from './in-memory-repositories.ts';

describe('in-memory repositories', () => {
	it('seeds at least 12 mixed courses', async () => {
		const courses = await new InMemoryCourseRepository().getAll();
		expect(courses.length).toBeGreaterThanOrEqual(12);
		expect(new Set(courses.map((c) => c.props.status))).toEqual(new Set(['draft', 'active', 'retired']));
		expect(new Set(courses.map((c) => c.props.modality))).toEqual(new Set(['online', 'in-person', 'hybrid']));
	});

	it('saves and gets enrollment requests', async () => {
		const repo = new InMemoryEnrollmentRequestRepository();
		const r = repo.getNewInstance('e1', { courseId: 'course-001', learnerEmail: 'a@b.co', justification: 'x'.repeat(20) }, '2026-01-01T00:00:00.000Z');
		await repo.save(r);
		expect(await repo.get('e1')).toBe(r);
		expect(await repo.getById('missing')).toBeUndefined();
		await expect(repo.get('missing')).rejects.toBeInstanceOf(NotFoundError);
	});
});
