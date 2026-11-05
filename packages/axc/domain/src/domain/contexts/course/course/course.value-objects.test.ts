import { describe, expect, it } from 'vitest';
import { isCourseModality, isCourseStatus } from './course.value-objects.ts';

describe('course value objects', () => {
	it.each([
		['online', true],
		['in-person', true],
		['hybrid', true],
		['remote', false],
	])('modality %s valid=%s', (value, ok) => expect(isCourseModality(value)).toBe(ok));

	it.each([
		['draft', true],
		['active', true],
		['retired', true],
		['open', false],
	])('status %s valid=%s', (value, ok) => expect(isCourseStatus(value)).toBe(ok));
});
