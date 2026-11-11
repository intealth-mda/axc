import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { describe, expect, it } from 'vitest';
import { courseSeed } from './course-seed.ts';
import { InMemoryCourseRepository } from './in-memory-course.repository.ts';

describe('InMemoryCourseRepository', () => {
	it('serves seed, saves new instances, throws on missing get', async () => {
		const repo = new InMemoryCourseRepository(courseSeed);
		expect((await repo.getAll()).length).toBe(courseSeed.length);
		const c = await repo.save(repo.getNewInstance('n1', { title: 'T', summary: 'S', modality: 'online', status: 'draft', tags: [] }, 'now'));
		expect((await repo.get('n1')).props.createdAt).toBe('now');
		expect(c.id).toBe('n1');
		await expect(repo.get('nope')).rejects.toThrow(NotFoundError);
	});
});
