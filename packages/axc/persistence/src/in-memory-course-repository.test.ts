import { describe, expect, it } from 'vitest';
import { courseSeed } from './course-seed.ts';
import { InMemoryCourseRepository } from './in-memory-course-repository.ts';

describe('InMemoryCourseRepository', () => {
	it('saves, gets, lists and rejects unknown ids', async () => {
		const repo = new InMemoryCourseRepository(courseSeed());
		expect(await repo.getAll()).toHaveLength(12);
		const c = repo.getNewInstance('x', { title: 'X', summary: 's', modality: 'hybrid', status: 'draft', tags: [] }, '2026-01-01T00:00:00.000Z');
		await repo.save(c);
		expect((await repo.get('x')).id).toBe('x');
		await expect(repo.getById('nope')).rejects.toThrow('not found');
	});
});
