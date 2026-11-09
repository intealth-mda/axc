import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

const c = Course.getNewInstance('c1', { title: 'AI Security', summary: 'Intro', modality: 'online', status: 'active', tags: ['AI', 'sec'] }, '2026-01-01T00:00:00.000Z');

describe('Course', () => {
	it('stamps id and times', () => {
		expect(c.toReference()).toMatchObject({ id: 'c1', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
	});
	it('matches keyword case-insensitively across title, summary, tags', () => {
		expect(c.matchesKeyword('security')).toBe(true);
		expect(c.matchesKeyword('INTRO')).toBe(true);
		expect(c.matchesKeyword('sec')).toBe(true);
		expect(c.matchesKeyword('zzz')).toBe(false);
	});
	it('matches tag exactly, case-insensitively', () => {
		expect(c.hasTag('ai')).toBe(true);
		expect(c.hasTag('a')).toBe(false);
	});
});
