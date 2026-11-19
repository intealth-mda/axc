import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

describe('Course', () => {
	it('creates with timestamps', () => {
		const c = Course.getNewInstance('c1', { title: 'T', summary: 'S', modality: 'online', status: 'draft', tags: ['a'] }, '2026-01-01T00:00:00.000Z');
		expect(c.toReference()).toMatchObject({ id: 'c1', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
	});
});
