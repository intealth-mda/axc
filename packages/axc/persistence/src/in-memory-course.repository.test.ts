import { describe, expect, it } from 'vitest';
import { InMemoryCourseRepository } from './in-memory-course.repository.ts';

describe('InMemoryCourseRepository', () => {
	it('seeds 12 courses of every status and saves new ones', async () => {
		const repo = new InMemoryCourseRepository();
		const all = await repo.getAll();
		expect(all).toHaveLength(12);
		expect(new Set(all.map((c) => c.props.status))).toEqual(new Set(['active', 'draft', 'retired']));
		await repo.save(repo.getNewInstance('n', { title: 't', summary: 's', modality: 'online', status: 'active', tags: [] }, 'now'));
		expect((await repo.get('n')).props.title).toBe('t');
		await expect(repo.get('missing')).rejects.toThrow(/not found/);
	});
});
