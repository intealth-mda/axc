import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { describe, expect, it } from 'vitest';
import { InMemoryCourseRepository } from './in-memory-course-repository.ts';

describe('InMemoryCourseRepository', () => {
	it('serves seed and saves new', async () => {
		const repo = new InMemoryCourseRepository();
		expect((await repo.getAll()).length).toBeGreaterThanOrEqual(12);
		await repo.save(repo.getNewInstance('x', { title: 'X', summary: 's', modality: 'online', status: 'draft', tags: [] }, 't'));
		expect((await repo.get('x')).id).toBe('x');
		await expect(repo.get('missing')).rejects.toThrow(NotFoundError);
	});
});
