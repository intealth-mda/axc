import { describe, expect, it } from 'vitest';
import { InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from './in-memory-repositories.ts';

describe('in-memory repositories', () => {
	it('seeds courses and reports missing ids', async () => {
		const repo = new InMemoryCourseRepository();
		expect((await repo.get('course-001')).props.title).toBe('AI Security Foundations');
		await expect(repo.get('nope')).rejects.toThrow('nope not found');
	});
	it('issues sequential enrollment ids and stores saved requests', async () => {
		const repo = new InMemoryEnrollmentRequestRepository();
		const input = { courseId: 'course-001', learnerEmail: 'a@b.org', justification: 'x'.repeat(20) };
		const first = await repo.save(repo.getNewInstance(input));
		expect([first.id, repo.getNewInstance(input).id]).toEqual(['enroll-001', 'enroll-002']);
		expect(await repo.getAll()).toEqual([first]);
	});
});
