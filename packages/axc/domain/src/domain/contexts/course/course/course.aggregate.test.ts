import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

const course = new Course({
	id: 'c1',
	title: 'AI Security Foundations',
	summary: 'Secure development.',
	modality: 'online',
	status: 'active',
	tags: ['AI', 'security'],
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('Course', () => {
	it('matches keyword in title, summary or tags case-insensitively', () => {
		expect(course.matchesKeyword('SECURITY')).toBe(true);
		expect(course.matchesKeyword('development')).toBe(true);
		expect(course.matchesKeyword('ai')).toBe(true);
		expect(course.matchesKeyword('cooking')).toBe(false);
	});

	it('matches tags case-insensitively and reports active', () => {
		expect(course.hasTag('ai')).toBe(true);
		expect(course.hasTag('cloud')).toBe(false);
		expect(course.isActive).toBe(true);
	});
});
