import { describe, expect, it } from 'vitest';
import { CourseTitle, InvalidCourseTitleError, isCourseModality, isCourseStatus } from './course.value-objects.ts';

describe('course value objects', () => {
	it.each([
		['online', true],
		['in-person', true],
		['hybrid', true],
		['remote', false],
	])('modality %s valid=%s', (v, ok) => expect(isCourseModality(v)).toBe(ok));
	it.each([
		['draft', true],
		['active', true],
		['retired', true],
		['live', false],
	])('status %s valid=%s', (v, ok) => expect(isCourseStatus(v)).toBe(ok));
	it('trims title and rejects empty', () => {
		expect(new CourseTitle('  A ').value).toBe('A');
		expect(() => new CourseTitle(' ')).toThrow(InvalidCourseTitleError);
	});
});
