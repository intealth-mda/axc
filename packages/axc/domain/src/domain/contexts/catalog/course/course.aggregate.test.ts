import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

const course = (status: 'active' | 'draft') => new Course({ id: 'c1', title: 'AI Security', summary: 'Intro', modality: 'online', status, tags: ['AI'], createdAt: 'x', updatedAt: 'x' }, undefined);

describe('Course', () => {
	it('matches keyword in title/tags case-insensitively and tags exactly', () => {
		const c = course('active');
		expect(c.matchesKeyword('security')).toBe(true);
		expect(c.matchesKeyword('ai')).toBe(true);
		expect(c.matchesKeyword('zzz')).toBe(false);
		expect(c.hasTag('ai')).toBe(true);
		expect(c.hasTag('a')).toBe(false);
	});
	it('isActive only for active', () => {
		expect(course('active').isActive).toBe(true);
		expect(course('draft').isActive).toBe(false);
	});
});
