import { describe, expect, it } from 'vitest';
import { isCourseStatus, isModality } from './course.value-objects.ts';

describe('course value objects', () => {
	it('guards modality and status', () => {
		expect(isModality('hybrid')).toBe(true);
		expect(isModality('remote')).toBe(false);
		expect(isCourseStatus('active')).toBe(true);
		expect(isCourseStatus('open')).toBe(false);
	});
});
