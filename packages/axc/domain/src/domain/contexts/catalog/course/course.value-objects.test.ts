import { describe, expect, it } from 'vitest';
import { CourseTitle, InvalidCourseTitleError, isCourseModality, isCourseStatus } from './course.value-objects.ts';

describe('course value objects', () => {
	it.each(['online', 'in-person', 'hybrid'])('accepts modality %s', (m) => expect(isCourseModality(m)).toBe(true));
	it('rejects bad modality/status', () => {
		expect(isCourseModality('remote')).toBe(false);
		expect(isCourseStatus('archived')).toBe(false);
		expect(isCourseStatus('active')).toBe(true);
	});
	it('validates title', () => {
		expect(new CourseTitle(' X ').value).toBe('X');
		expect(() => new CourseTitle(' ')).toThrow(InvalidCourseTitleError);
	});
});
