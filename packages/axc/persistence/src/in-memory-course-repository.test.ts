import { describe, expect, it } from 'vitest';
import { InMemoryCourseRepository } from './in-memory-course-repository.ts';

describe('InMemoryCourseRepository', () => {
	it('seeds 12+ courses and gets by id', async () => {
		const repo = new InMemoryCourseRepository();
		expect((await repo.getAll()).length).toBeGreaterThanOrEqual(12);
		expect((await repo.getById('course-001')).props.title).toBe('AI Security Foundations');
	});
	it('saves and rejects missing', async () => {
		const repo = new InMemoryCourseRepository([]);
		const c = repo.getNewInstance({ id: 'x', title: 'T', summary: 'S', modality: 'online', status: 'draft', tags: [], createdAt: 'a', updatedAt: 'b' });
		await repo.save(c);
		expect((await repo.get('x')).id).toBe('x');
		await expect(repo.get('nope')).rejects.toThrow();
	});
});
