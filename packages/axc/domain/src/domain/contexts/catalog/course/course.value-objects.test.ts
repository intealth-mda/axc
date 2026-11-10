import { describe, expect, it } from 'vitest';
import { CourseTitle, InvalidCourseTitleError, isCourseModality, isCourseStatus } from './course.value-objects.ts';

describe('course value objects', () => {
	it.each([
		['online', true],
		['hybrid', true],
		['Online', false],
	])('isCourseModality(%s) = %s', (v, ok) => expect(isCourseModality(v)).toBe(ok));
	it.each([
		['draft', true],
		['retired', true],
		['archived', false],
	])('isCourseStatus(%s) = %s', (v, ok) => expect(isCourseStatus(v)).toBe(ok));
	it('trims title and rejects blank', () => {
		expect(new CourseTitle(' X ').value).toBe('X');
		expect(() => new CourseTitle('  ')).toThrow(InvalidCourseTitleError);
	});
});
