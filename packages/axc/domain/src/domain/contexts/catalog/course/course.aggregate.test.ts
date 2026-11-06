import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

const props = { id: 'c1', title: 'T', summary: 'S', modality: 'online', tags: ['ai'], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' } as const;

describe('Course', () => {
	it.each([
		['active', true],
		['draft', false],
		['retired', false],
	] as const)('status %s -> isActive %s', (status, active) => {
		expect(Course.getNewInstance({ ...props, status }).isActive).toBe(active);
	});
});
