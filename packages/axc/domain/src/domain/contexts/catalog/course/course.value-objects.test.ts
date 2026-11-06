import { describe, expect, it } from 'vitest';
import { isCourseStatus, isModality } from './course.value-objects.ts';

describe('course value objects', () => {
	it('narrows modality and status', () => {
		expect(isModality('in-person')).toBe(true);
		expect(isModality('remote')).toBe(false);
		expect(isCourseStatus('retired')).toBe(true);
		expect(isCourseStatus('open')).toBe(false);
	});
});
