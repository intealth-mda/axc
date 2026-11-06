import { describe, expect, it } from 'vitest';
import { CourseTitle, InvalidCourseTitleError, isCourseModality, isCourseSortField, isCourseStatus } from './course.value-objects.ts';

describe('course value objects', () => {
	it.each([
		[isCourseModality, 'in-person', 'remote'],
		[isCourseStatus, 'retired', 'archived'],
		[isCourseSortField, 'updatedAt', 'id'],
	])('guards allowed values', (guard, ok, bad) => {
		expect(guard(ok)).toBe(true);
		expect(guard(bad)).toBe(false);
	});

	it('rejects an empty title', () => {
		expect(() => new CourseTitle(' ')).toThrow(InvalidCourseTitleError);
		expect(new CourseTitle('A').value).toBe('A');
	});
});
