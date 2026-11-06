import { describe, expect, it } from 'vitest';
import { InMemoryCourseRepository } from './in-memory-course-repository.ts';

describe('InMemoryCourseRepository', () => {
	it('is seeded with 12 courses and saves new ones', async () => {
		const repo = new InMemoryCourseRepository();
		expect(await repo.getAll()).toHaveLength(12);
		await repo.save(repo.getNewInstance('n1', { title: 'T', summary: 's', modality: 'online', status: 'draft', tags: [] }, '2026-01-01T00:00:00.000Z'));
		expect((await repo.getById('n1')).props.title).toBe('T');
		await expect(repo.get('missing')).rejects.toThrow();
	});
});
