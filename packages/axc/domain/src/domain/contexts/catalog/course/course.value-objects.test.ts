import { describe, expect, it } from 'vitest';
import { isModality, isStatus } from './course.value-objects.ts';

describe('course value objects', () => {
	it.each([
		['online', true],
		['hybrid', true],
		['remote', false],
	])('isModality(%s) = %s', (v, ok) => expect(isModality(v)).toBe(ok));
	it.each([
		['draft', true],
		['retired', true],
		['open', false],
	])('isStatus(%s) = %s', (v, ok) => expect(isStatus(v)).toBe(ok));
});
