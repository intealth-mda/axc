import { describe, expect, it } from 'vitest';
import { isCourseStatus, isModality } from './course.value-objects.ts';

describe('course value objects', () => {
	it.each([
		['online', true],
		['in-person', true],
		['remote', false],
	])('isModality(%s) is %s', (v, ok) => expect(isModality(v)).toBe(ok));
	it.each([
		['active', true],
		['retired', true],
		['open', false],
	])('isCourseStatus(%s) is %s', (v, ok) => expect(isCourseStatus(v)).toBe(ok));
});
