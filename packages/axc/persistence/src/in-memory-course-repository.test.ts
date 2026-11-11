import { describe, expect, it } from 'vitest';
import { courseSeed } from './course-seed.ts';
import { InMemoryCourseRepository } from './in-memory-course-repository.ts';

describe('InMemoryCourseRepository', () => {
	it('loads seed and saves new courses', async () => {
		const repo = new InMemoryCourseRepository(courseSeed);
		expect((await repo.getAll()).length).toBe(courseSeed.length);
		const c = await repo.save(await repo.getNewInstance('x', { title: 't', summary: 's', modality: 'hybrid', status: 'draft', tags: [] }, 'now'));
		expect((await repo.getById('x')).id).toBe(c.id);
		await expect(repo.get('missing')).rejects.toThrow();
	});
});
