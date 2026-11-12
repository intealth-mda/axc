import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

describe('Course', () => {
	it('creates with given id and timestamps', () => {
		const c = Course.getNewInstance('c1', { title: 'T', summary: 'S', modality: 'online', status: 'draft', tags: ['ai'] }, '2026-01-01T00:00:00.000Z');
		expect(c.reference).toMatchObject({ id: 'c1', title: 'T', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
	});
});
