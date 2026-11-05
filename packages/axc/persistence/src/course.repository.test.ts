import { describe, expect, it } from 'vitest';
import { InMemoryCourseRepository } from './course.repository.ts';
import { courseSeed } from './course.seed.ts';

describe('InMemoryCourseRepository', () => {
	it('loads seed and saves new courses', async () => {
		const repo = new InMemoryCourseRepository(courseSeed);
		expect((await repo.getAll()).length).toBeGreaterThanOrEqual(12);
		const c = repo.getNewInstance('x', { title: 'X', summary: 'x', modality: 'online', status: 'draft', tags: [] }, 'now');
		await repo.save(c);
		expect((await repo.getById('x')).id).toBe('x');
		await expect(repo.get('missing')).rejects.toThrow();
	});
});
