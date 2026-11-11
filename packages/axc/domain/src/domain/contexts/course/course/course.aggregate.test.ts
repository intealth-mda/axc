import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

const base = { id: 'c1', title: 'T', summary: 'S', modality: 'online', tags: ['ai'], createdAt: 'x', updatedAt: 'y' } as const;

describe('Course', () => {
	it.each([
		['active', true],
		['draft', false],
		['retired', false],
	] as const)('status %s isActive %s', (status, active) => {
		const course = Course.getNewInstance({ ...base, status });
		expect(course.isActive).toBe(active);
		expect(course.toReference()).toEqual({ ...base, status });
	});
});
