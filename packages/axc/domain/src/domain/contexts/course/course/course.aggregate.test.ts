import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

describe('Course', () => {
	it('stamps timestamps and reports active', () => {
		const c = Course.getNewInstance('c1', { title: 't', summary: 's', modality: 'online', status: 'active', tags: [] }, '2026-01-01T00:00:00.000Z');
		expect(c.props.createdAt).toBe('2026-01-01T00:00:00.000Z');
		expect(c.isActive).toBe(true);
		expect(Course.getNewInstance('c2', { ...c.props, status: 'draft' }, 'x').isActive).toBe(false);
	});
});
