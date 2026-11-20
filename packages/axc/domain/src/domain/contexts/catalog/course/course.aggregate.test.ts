import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

const props = { id: 'c1', title: 'AI Security', summary: 'Secure dev', modality: 'online', status: 'active', tags: ['AI'], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' } as const;

describe('Course', () => {
	it('matches keyword in title, summary, tags case-insensitively', () => {
		const c = Course.create(props);
		expect(c.matches('security')).toBe(true);
		expect(c.matches('DEV')).toBe(true);
		expect(c.matches('ai')).toBe(true);
		expect(c.matches('cloud')).toBe(false);
	});
	it('hasTag is exact and case-insensitive', () => {
		const c = Course.create(props);
		expect(c.hasTag('ai')).toBe(true);
		expect(c.hasTag('a')).toBe(false);
	});
	it('rejects blank title', () => expect(() => Course.create({ ...props, title: ' ' })).toThrow());
	it('toReference copies props', () => expect(Course.create(props).toReference().id).toBe('c1'));
});
