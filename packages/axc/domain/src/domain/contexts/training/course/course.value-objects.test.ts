import { describe, expect, it } from 'vitest';
import { isCourseModality, isCourseSort, isCourseStatus } from './course.value-objects.ts';

describe('course value objects', () => {
	it('guards enums', () => {
		expect(isCourseModality('hybrid')).toBe(true);
		expect(isCourseModality('remote')).toBe(false);
		expect(isCourseStatus('retired')).toBe(true);
		expect(isCourseStatus('x')).toBe(false);
		expect(isCourseSort('createdAt')).toBe(true);
		expect(isCourseSort('id')).toBe(false);
	});
});
