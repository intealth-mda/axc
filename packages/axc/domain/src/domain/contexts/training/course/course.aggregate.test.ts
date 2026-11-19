import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

const c = Course.getNewInstance({ id: 'c1', title: 'AI Security', summary: 'Intro', modality: 'online', status: 'active', tags: ['AI'], createdAt: 'a', updatedAt: 'b' });

describe('Course', () => {
	it('matches keyword and tag case-insensitively', () => {
		expect(c.matchesKeyword('security')).toBe(true);
		expect(c.matchesKeyword('ai')).toBe(true);
		expect(c.matchesKeyword('zzz')).toBe(false);
		expect(c.hasTag('ai')).toBe(true);
		expect(c.isActive).toBe(true);
		expect(c.toJSON().id).toBe('c1');
	});
});
