import { describe, expect, it } from 'vitest';
import { isCourseModality, isCourseStatus } from './course.value-objects.ts';

describe('course value objects', () => {
	it.each([
		['online', true],
		['in-person', true],
		['remote', false],
	])('modality %s valid=%s', (v, ok) => expect(isCourseModality(v)).toBe(ok));
	it.each([
		['active', true],
		['archived', false],
	])('status %s valid=%s', (v, ok) => expect(isCourseStatus(v)).toBe(ok));
});
