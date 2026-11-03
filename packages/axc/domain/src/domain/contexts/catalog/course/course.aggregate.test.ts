import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

const course = (status: 'draft' | 'active' | 'retired') =>
	Course.getNewInstance({ id: 'c1', title: 'AI Security', summary: 'Secure dev', modality: 'online', status, tags: ['AI', 'cloud'], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });

describe('Course', () => {
	it('is active only when status is active', () => {
		expect([course('active').isActive, course('draft').isActive, course('retired').isActive]).toEqual([true, false, false]);
	});
	it.each(['security', 'SECURE DEV', 'Cloud'])('matches keyword %s in title, summary or tags', (k) => {
		expect(course('active').matchesKeyword(k)).toBe(true);
	});
	it('matches tags case-insensitively and exactly', () => {
		expect([course('active').hasTag('ai'), course('active').hasTag('a')]).toEqual([true, false]);
	});
});
