import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

describe('Course', () => {
	it('exposes reference and active flag', () => {
		const props = { id: 'c1', title: 'T', summary: 'S', modality: 'online', status: 'active', tags: ['ai'], createdAt: 'x', updatedAt: 'y' } as const;
		const course = Course.getNewInstance(props);
		expect(course.isActive).toBe(true);
		expect(course.toReference()).toEqual(props);
		expect(Course.getNewInstance({ ...props, status: 'draft' }).isActive).toBe(false);
	});
});
