import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

describe('Course', () => {
	it('creates with timestamps and reports active', () => {
		const c = Course.getNewInstance('c1', { title: 'T', summary: 's', modality: 'online', status: 'active', tags: ['ai'] }, '2026-01-01T00:00:00.000Z');
		expect(c.isActive).toBe(true);
		expect(c.toReference()).toMatchObject({ id: 'c1', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
		expect(Course.fromProps({ ...c.toReference(), status: 'draft', tags: [] }).isActive).toBe(false);
	});
});
