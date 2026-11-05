import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

describe('Course', () => {
	const input = { title: 'T', summary: 'S', modality: 'online' as const, status: 'draft' as const, tags: ['ai'] };
	it('creates with timestamps', () => {
		const c = Course.getNewInstance('c1', input, '2026-01-01T00:00:00.000Z');
		expect(c.reference).toMatchObject({ id: 'c1', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
	});
	it('validates modality', () => {
		expect(() => Course.getNewInstance('c1', { ...input, modality: 'x' as 'online' }, 'now')).toThrow();
	});
});
