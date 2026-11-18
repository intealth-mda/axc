import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

const c = Course.getNewInstance('c1', { title: 'AI Security', summary: 'Secure dev', modality: 'online', status: 'active', tags: ['AI'] }, '2026-01-01T00:00:00.000Z');

describe('Course', () => {
	it('creates with timestamps', () => {
		expect(c.toReference()).toMatchObject({ id: 'c1', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
	});
	it('matches keyword in title, summary, tags case-insensitively', () => {
		expect(c.matchesKeyword('security')).toBe(true);
		expect(c.matchesKeyword('SECURE')).toBe(true);
		expect(c.matchesKeyword('ai')).toBe(true);
		expect(c.matchesKeyword('cooking')).toBe(false);
	});
	it('matches tag exactly, case-insensitively', () => {
		expect(c.hasTag('ai')).toBe(true);
		expect(c.hasTag('a')).toBe(false);
	});
});
