import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { describe, expect, it } from 'vitest';
import { courseSeed } from './course-seed.ts';
import { InMemoryCourseRepository } from './in-memory-course-repository.ts';

describe('InMemoryCourseRepository', () => {
	it('loads seed and saves new instances', async () => {
		const repo = new InMemoryCourseRepository(courseSeed);
		expect((await repo.getAll()).length).toBeGreaterThanOrEqual(12);
		const c = repo.getNewInstance('x', { title: 'T', summary: 's', modality: 'online', status: 'draft', tags: [] }, '2026-01-01T00:00:00.000Z');
		await repo.save(c);
		expect((await repo.getById('x')).id).toBe('x');
		await expect(repo.get('nope')).rejects.toBeInstanceOf(NotFoundError);
	});
});
