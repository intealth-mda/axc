import { Course, EnrollmentRequest } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { describe, expect, it } from 'vitest';
import { InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from './in-memory-repository.ts';

describe('in-memory repositories', () => {
	it('seeds courses and saves new ones', async () => {
		const repo = new InMemoryCourseRepository();
		expect((await repo.getById('course-001'))?.props.title).toBe('AI Security Foundations');
		const c = repo.getNewInstance({ id: 'n', title: 't', summary: 's', modality: 'online', status: 'draft', tags: [], createdAt: 'a', updatedAt: 'a' });
		await repo.save(c);
		expect(await repo.get('n')).toBeInstanceOf(Course);
	});

	it('stores enrollment requests and throws NotFoundError on get', async () => {
		const repo = new InMemoryEnrollmentRequestRepository();
		const r = repo.getNewInstance('e1', { courseId: 'c', learnerEmail: 'a@b.co', justification: 'x'.repeat(20) }, 't');
		await repo.save(r);
		expect(await repo.getAll()).toEqual([r]);
		expect(r).toBeInstanceOf(EnrollmentRequest);
		expect(await repo.getById('none')).toBeUndefined();
		await expect(repo.get('none')).rejects.toThrow(NotFoundError);
	});
});
