import { describe, expect, it } from 'vitest';
import { courseSeed } from './course-seed.ts';
import { InMemoryCourseRepository } from './in-memory-course-repository.ts';

describe('InMemoryCourseRepository', () => {
	it('loads seed and finds by id', async () => {
		const repo = new InMemoryCourseRepository(courseSeed);
		expect((await repo.getAll()).length).toBeGreaterThanOrEqual(12);
		expect((await repo.getById('course-001')).props.title).toBe('AI Security Foundations');
		await expect(repo.get('missing')).rejects.toThrow();
	});
});
