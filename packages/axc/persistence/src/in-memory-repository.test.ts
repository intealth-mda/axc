import { describe, expect, it } from 'vitest';
import { InMemoryCourseRepository } from './in-memory-repositories.ts';

describe('InMemoryRepository', () => {
	it('overwrites on save', async () => {
		const repo = new InMemoryCourseRepository([]);
		const c = repo.getNewInstance({ id: 'x', title: 't', summary: 's', modality: 'online', status: 'active', tags: [], createdAt: 'a', updatedAt: 'b' });
		await repo.save(c);
		await repo.save(c);
		expect(await repo.getAll()).toHaveLength(1);
	});
});
