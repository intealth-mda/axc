import { describe, expect, it } from 'vitest';
import { CourseTitle, InvalidCourseValueError, isCourseStatus, isModality } from './course.value-objects.ts';

describe('course value objects', () => {
	it.each([
		['online', true],
		['in-person', true],
		['virtual', false],
	])('isModality(%s) = %s', (v, ok) => expect(isModality(v)).toBe(ok));
	it('guards status', () => {
		expect(isCourseStatus('retired')).toBe(true);
		expect(isCourseStatus('archived')).toBe(false);
	});
	it('rejects empty title', () => {
		expect(() => new CourseTitle(' ')).toThrow(InvalidCourseValueError);
		expect(new CourseTitle(' A ').value).toBe('A');
	});
});
