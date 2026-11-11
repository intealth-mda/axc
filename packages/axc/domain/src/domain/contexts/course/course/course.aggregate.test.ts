import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

const make = (id: string, title: string, createdAt: string) => new Course({ id, title, summary: 'Intro to Secure code', modality: 'online', status: 'active', tags: ['AI', 'security'], createdAt, updatedAt: createdAt }, undefined);

describe('Course', () => {
	const c = make('c1', 'Alpha', '2026-01-01');
	it.each([
		[{}, true],
		[{ q: 'SECURE' }, true],
		[{ q: 'ai' }, true],
		[{ q: 'zzz' }, false],
		[{ tag: 'ai' }, true],
		[{ tag: 'a' }, false],
		[{ modality: 'hybrid' as const }, false],
		[{ status: 'active' as const, modality: 'online' as const }, true],
	])('matches %o -> %s', (criteria, expected) => {
		expect(c.matches(criteria)).toBe(expected);
	});
	it('is active and sorts', () => {
		expect(c.isActive).toBe(true);
		const list = [make('b', 'Beta', '2025-01-01'), c].sort(Course.compare('title'));
		expect(list.map((x) => x.id)).toEqual(['c1', 'b']);
		expect(list.sort(Course.compare('createdAt')).map((x) => x.id)).toEqual(['b', 'c1']);
	});
});
