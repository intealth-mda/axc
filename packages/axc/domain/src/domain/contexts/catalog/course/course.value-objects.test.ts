import { describe, expect, it } from 'vitest';
import { CourseTags, CourseTitle, InvalidCourseValueError, isCourseStatus, isModality } from './course.value-objects.ts';

describe('course value objects', () => {
	it.each([
		['online', true],
		['in-person', true],
		['hybrid', true],
		['remote', false],
	])('isModality(%s)=%s', (v, ok) => expect(isModality(v)).toBe(ok));
	it.each([
		['draft', true],
		['active', true],
		['retired', true],
		['gone', false],
	])('isCourseStatus(%s)=%s', (v, ok) => expect(isCourseStatus(v)).toBe(ok));
	it('rejects empty title', () => expect(() => new CourseTitle(' ')).toThrow(InvalidCourseValueError));
	it('normalizes tags', () => expect(new CourseTags(['AI', 'ai', ' Sec ']).value).toEqual(['ai', 'sec']));
	it('rejects empty tag', () => expect(() => new CourseTags([''])).toThrow(InvalidCourseValueError));
});
