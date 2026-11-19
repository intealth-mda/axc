import { describe, expect, it } from 'vitest';
import { isCourseModality, isCourseStatus } from './course.value-objects.ts';

describe('course value objects', () => {
	it('guards modality and status', () => {
		expect(isCourseModality('in-person')).toBe(true);
		expect(isCourseModality('remote')).toBe(false);
		expect(isCourseStatus('retired')).toBe(true);
		expect(isCourseStatus('open')).toBe(false);
	});
});
