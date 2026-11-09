import { describe, expect, it } from 'vitest';
import { Course, type CourseProps } from './course.aggregate.ts';

const props: CourseProps = { id: 'one', title: 'Course', summary: 'Summary', modality: 'online', status: 'draft', tags: ['ai'], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
describe('Course aggregate', () => {
	it('creates valid state, preserves every field and isolates supplied tags', () => {
		const input = { ...props, tags: ['ai'] };
		const course = Course.getNewInstance(input);
		expect(course.props).toEqual(props);
		input.tags.push('changed');
		expect(course.tags).toEqual(['ai']);
	});
	it.each([
		{ modality: 'invalid' },
		{ status: 'invalid' },
		{ title: '' },
		{ summary: '' },
		{ id: '' },
		{ createdAt: 'bad' },
		{ updatedAt: '2025-01-01T00:00:00.000Z' },
		{ tags: [''] },
	])('rejects invalid initial state %j', (patch) => expect(() => Course.getNewInstance({ ...props, ...patch } as CourseProps)).toThrow());
	it('rehydrates existing lifecycle state separately', () => {
		expect(new Course({ ...props, status: 'retired' }).status).toBe('retired');
	});
});
