import { describe, expect, it } from 'vitest';
import { CourseTitle, isCourseModality, isCourseSortField, isCourseStatus } from './course.value-objects.ts';

describe('course value objects', () => {
	it.each([
		[isCourseModality, 'in-person', true],
		[isCourseModality, 'remote', false],
		[isCourseStatus, 'retired', true],
		[isCourseStatus, 'archived', false],
		[isCourseSortField, 'createdAt', true],
		[isCourseSortField, 'id', false],
	])('guard %#', (guard, value, ok) => expect(guard(value)).toBe(ok));
	it('rejects an empty title', () => expect(() => new CourseTitle(' ')).toThrow('title'));
});
