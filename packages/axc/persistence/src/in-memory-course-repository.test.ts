import { describe, expect, it } from 'vitest';
import { courseSeed } from './course-seed.ts';
import { InMemoryCourseRepository } from './in-memory-course-repository.ts';

describe('InMemoryCourseRepository', () => {
	it('loads seed, saves and gets', async () => {
		const repo = new InMemoryCourseRepository(courseSeed);
		expect((await repo.getAll()).length).toBe(12);
		await repo.save(repo.getNewInstance('x', { title: 'X', summary: 's', modality: 'online', status: 'draft', tags: [] }, '2026-01-01T00:00:00.000Z'));
		expect((await repo.getById('x')).reference.title).toBe('X');
		await expect(repo.get('missing')).rejects.toThrow();
	});
});
