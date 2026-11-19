import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { describe, expect, it } from 'vitest';
import { InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from './in-memory-repositories.ts';

describe('in-memory repositories', () => {
	it('seeds 12+ courses of mixed modality, status and tags', async () => {
		const all = (await new InMemoryCourseRepository().getAll()).map((c) => c.toReference());
		expect(all.length).toBeGreaterThanOrEqual(12);
		expect(new Set(all.map((c) => c.modality)).size).toBe(3);
		expect(new Set(all.map((c) => c.status)).size).toBe(3);
		expect(new Set(all.flatMap((c) => c.tags)).size).toBeGreaterThan(3);
	});
	it('saves, gets and reports missing ids', async () => {
		const repo = new InMemoryEnrollmentRequestRepository();
		const r = repo.getNewInstance('e1', { courseId: 'c', learnerEmail: 'a@b.co', justification: 'x'.repeat(20) }, 't');
		await repo.save(r);
		expect(await repo.get('e1')).toBe(r);
		expect(await repo.getById('nope')).toBeUndefined();
		await expect(repo.get('nope')).rejects.toBeInstanceOf(NotFoundError);
	});
});
