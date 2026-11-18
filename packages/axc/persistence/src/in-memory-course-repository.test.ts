import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { describe, expect, it } from 'vitest';
import { courseSeed } from './course-seed.ts';
import { InMemoryCourseRepository } from './in-memory-course-repository.ts';

describe('InMemoryCourseRepository', () => {
	it('loads seed and saves new courses', async () => {
		const repo = new InMemoryCourseRepository(courseSeed);
		expect((await repo.getAll()).length).toBe(12);
		await repo.save(repo.getNewInstance('x', { title: 'T', summary: 'S', modality: 'hybrid', status: 'draft', tags: [] }, '2026-01-01T00:00:00.000Z'));
		expect((await repo.getById('x')).props.title).toBe('T');
		await expect(repo.get('nope')).rejects.toBeInstanceOf(NotFoundError);
	});
});
