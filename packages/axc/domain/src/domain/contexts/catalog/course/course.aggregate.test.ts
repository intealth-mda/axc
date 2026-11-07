import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

const props = { id: 'a', title: 'A', summary: 'B', modality: 'online' as const, status: 'active' as const, tags: ['ai'], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
describe('Course', () => {
	it('creates a valid aggregate and isolates tags', () => {
		const course = Course.getNewInstance(props);
		expect(course.toReference()).toEqual(props);
		course.tags.push('other');
		expect(course.tags).toEqual(['ai']);
	});
	it('rejects invalid values at factory', () => {
		expect(() => Course.getNewInstance({ ...props, modality: 'remote' as never })).toThrow();
	});
});
