import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

const c = Course.getNewInstance('c1', { title: 'AI Security', summary: 'Secure dev', modality: 'online', status: 'active', tags: ['AI'] }, '2026-01-01T00:00:00.000Z');

describe('Course', () => {
	it('sets timestamps', () => expect(c.reference.updatedAt).toBe('2026-01-01T00:00:00.000Z'));
	it.each([
		['security', true],
		['SECURE', true],
		['ai', true],
		['cloud', false],
	])('matchesKeyword(%s) = %s', (q, ok) => expect(c.matchesKeyword(q)).toBe(ok));
	it('hasTag is case-insensitive and exact', () => {
		expect(c.hasTag('ai')).toBe(true);
		expect(c.hasTag('a')).toBe(false);
	});
});
