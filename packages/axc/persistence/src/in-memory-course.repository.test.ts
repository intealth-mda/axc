import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { describe, expect, it } from 'vitest';
import { InMemoryCourseRepository } from './in-memory-course.repository.ts';

describe('InMemoryCourseRepository', () => {
	it('serves seed courses and saves new ones', async () => {
		const repo = new InMemoryCourseRepository();
		expect((await repo.get('course-001')).props.title).toBe('AI Security Foundations');
		await expect(repo.get('nope')).rejects.toThrow(NotFoundError);
		const n = await repo.findAll();
		await repo.save(repo.getNewInstance('x', { title: 'T', summary: 'S', modality: 'online', status: 'draft', tags: [] }, 'now'));
		expect(await repo.findAll()).toHaveLength(n.length + 1);
	});
});
