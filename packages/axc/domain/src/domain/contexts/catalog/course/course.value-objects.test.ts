import { describe, expect, it } from 'vitest';
import { CourseModality, CourseStatus } from './course.value-objects.ts';

describe('course value objects', () => {
	it.each(['online', 'in-person', 'hybrid'])('accepts modality %s', (v) => expect(new CourseModality(v).value).toBe(v));
	it.each(['draft', 'active', 'retired'])('accepts status %s', (v) => expect(new CourseStatus(v).value).toBe(v));
	it('rejects unknown values', () => {
		expect(() => new CourseModality('Online')).toThrow('modality must be one of');
		expect(() => new CourseStatus('live')).toThrow('status must be one of');
		expect(CourseModality.isValid('hybrid') && !CourseStatus.isValid('x')).toBe(true);
	});
});
