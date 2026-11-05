import { describe, expect, it } from 'vitest';
import { CourseModality, CourseStatus, InvalidCourseValueError } from './course.value-objects.ts';

describe('course value objects', () => {
	it.each(['online', 'in-person', 'hybrid'])('accepts modality %s', (m) => expect(new CourseModality(m).value).toBe(m));
	it.each(['draft', 'active', 'retired'])('accepts status %s', (s) => expect(new CourseStatus(s).value).toBe(s));
	it('rejects unknown values', () => {
		expect(() => new CourseModality('remote')).toThrow(InvalidCourseValueError);
		expect(() => new CourseStatus('live')).toThrow(InvalidCourseValueError);
	});
});
