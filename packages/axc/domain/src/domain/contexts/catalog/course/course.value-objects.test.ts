import { describe, expect, it } from 'vitest';
import { CourseTitle, InvalidCourseValueError, isCourseModality, isCourseStatus } from './course.value-objects.ts';

describe('course value objects', () => {
	it.each([
		['online', true],
		['in-person', true],
		['hybrid', true],
		['Online', false],
	])('modality %s -> %s', (v, ok) => expect(isCourseModality(v)).toBe(ok));
	it.each([
		['draft', true],
		['active', true],
		['retired', true],
		['x', false],
	])('status %s -> %s', (v, ok) => expect(isCourseStatus(v)).toBe(ok));
	it('rejects blank title', () => {
		expect(() => new CourseTitle(' ')).toThrow(InvalidCourseValueError);
		expect(new CourseTitle('A').value).toBe('A');
	});
});
