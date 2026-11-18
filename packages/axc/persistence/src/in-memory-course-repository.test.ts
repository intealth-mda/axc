import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { describe, expect, it } from 'vitest';
import { InMemoryCourseRepository } from './in-memory-course-repository.ts';

describe('InMemoryCourseRepository', () => {
	it('seeds 12+ courses and saves new ones', async () => {
		const repo = new InMemoryCourseRepository();
		expect((await repo.getAll()).length).toBeGreaterThanOrEqual(12);
		await repo.save(repo.getNewInstance('x', { title: 't', summary: 's', modality: 'online', status: 'draft', tags: [] }, '2026-01-01T00:00:00.000Z'));
		expect((await repo.getById('x')).title).toBe('t');
		await expect(repo.get('nope')).rejects.toThrow(NotFoundError);
	});
});
