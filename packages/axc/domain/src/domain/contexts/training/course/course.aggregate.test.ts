import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

const c = new Course({ id: 'c1', title: 'AI Security', summary: 'Intro', modality: 'online', status: 'active', tags: ['ML'], createdAt: 'x', updatedAt: 'x' }, undefined);

describe('Course', () => {
	it('matches keyword and tag case-insensitively', () => {
		expect(c.matchesKeyword('security')).toBe(true);
		expect(c.matchesKeyword('ml')).toBe(true);
		expect(c.matchesKeyword('zzz')).toBe(false);
		expect(c.hasTag('ml')).toBe(true);
		expect(c.isActive).toBe(true);
		expect(c.toReference().id).toBe('c1');
	});
});
