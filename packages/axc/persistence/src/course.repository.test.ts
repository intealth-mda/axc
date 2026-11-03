import { Course } from '@axc/domain';
import { describe, expect, it } from 'vitest';
import { courseSeed, InMemoryCourseRepository } from './course.repository.ts';

describe('InMemoryCourseRepository', () => {
	it('seeds 12+ mixed courses and supports get/save', async () => {
		const repo = new InMemoryCourseRepository();
		const all = await repo.getAll();
		expect(all.length).toBeGreaterThanOrEqual(12);
		expect(new Set(courseSeed.map((c) => c.modality)).size).toBe(3);
		expect(new Set(courseSeed.map((c) => c.status)).size).toBe(3);
		const fresh = repo.getNewInstance({ ...(courseSeed[0] as (typeof courseSeed)[number]), id: 'x' });
		expect(await repo.save(fresh)).toBeInstanceOf(Course);
		expect((await repo.get('x')).id).toBe('x');
		await expect(repo.getById('missing')).rejects.toThrow('not found');
	});
});
