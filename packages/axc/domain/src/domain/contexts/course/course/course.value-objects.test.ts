import { describe, expect, it } from 'vitest';
import { isCourseModality, isCourseSortField, isCourseStatus } from './course.value-objects.ts';

describe('course value objects', () => {
	it.each([
		[isCourseModality, 'hybrid', true],
		[isCourseModality, 'remote', false],
		[isCourseStatus, 'retired', true],
		[isCourseStatus, 'open', false],
		[isCourseSortField, 'createdAt', true],
		[isCourseSortField, 'id', false],
	])('%o(%s) is %s', (guard, value, expected) => {
		expect(guard(value)).toBe(expected);
	});
});
