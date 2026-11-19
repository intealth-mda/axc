import { describe, expect, it } from 'vitest';
import { InMemoryCourseRepository } from './in-memory-course-repository.ts';

describe('InMemoryCourseRepository', () => {
	it('seeds 12+ mixed courses and saves', async () => {
		const repo = new InMemoryCourseRepository();
		const all = await repo.getAll();
		expect(all.length).toBeGreaterThanOrEqual(12);
		expect(new Set(all.map((c) => c.props.modality)).size).toBe(3);
		expect(new Set(all.map((c) => c.props.status)).size).toBe(3);
		await repo.save(repo.getNewInstance('x', { title: 'X', summary: 's', modality: 'online', status: 'draft', tags: [] }, 'now'));
		expect((await repo.getById('x')).props.title).toBe('X');
		await expect(repo.get('nope')).rejects.toThrow();
	});
});
