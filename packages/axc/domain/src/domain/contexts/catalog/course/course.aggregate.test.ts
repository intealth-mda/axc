import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

const course = (status: 'active' | 'draft') => Course.create({ id: 'c1', title: 'AI Security', summary: 'Intro', modality: 'online', status, tags: ['AI'], createdAt: 't', updatedAt: 't' });

describe('Course', () => {
	it('matches keyword in title, summary or tags case-insensitively', () => {
		expect(course('active').matchesKeyword('security')).toBe(true);
		expect(course('active').matchesKeyword('ai')).toBe(true);
		expect(course('active').matchesKeyword('cloud')).toBe(false);
	});
	it('matches tag case-insensitively', () => expect(course('active').hasTag('ai')).toBe(true));
	it('is active only when status active', () => {
		expect(course('active').isActive).toBe(true);
		expect(course('draft').isActive).toBe(false);
	});
});
