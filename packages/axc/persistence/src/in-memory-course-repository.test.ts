import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { describe, expect, it } from 'vitest';
import { courseSeed } from './course-seed.ts';
import { InMemoryCourseRepository } from './in-memory-course-repository.ts';

describe('InMemoryCourseRepository', () => {
	it('holds the seed and saves new courses', async () => {
		const repo = new InMemoryCourseRepository(courseSeed());
		expect((await repo.getAll()).length).toBeGreaterThanOrEqual(12);
		await repo.save(repo.getNewInstance('n1', { title: 'T', summary: 's', modality: 'online', status: 'draft', tags: [] }, 'now'));
		expect((await repo.get('n1')).props.title).toBe('T');
		await expect(repo.get('missing')).rejects.toThrow(NotFoundError);
	});
});
