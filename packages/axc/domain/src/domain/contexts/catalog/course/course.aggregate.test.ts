import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

describe('Course', () => {
	it('creates with id and timestamps from caller', () => {
		const c = Course.getNewInstance('c1', { title: ' T ', summary: 's', modality: 'online', status: 'draft', tags: ['ai'] }, '2026-01-01T00:00:00.000Z');
		expect(c.toReference()).toEqual({ id: 'c1', title: 'T', summary: 's', modality: 'online', status: 'draft', tags: ['ai'], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
	});
});
