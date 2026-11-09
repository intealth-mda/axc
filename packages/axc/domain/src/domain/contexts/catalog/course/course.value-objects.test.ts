import { describe, expect, it } from 'vitest';
import { Modality, Status } from './course.value-objects.ts';

describe('Course constrained values', () => {
	it.each(['online', 'in-person', 'hybrid'])('accepts modality %s', (value) => expect(new Modality(value).valueOf()).toBe(value));
	it.each(['draft', 'active', 'retired'])('accepts status %s', (value) => expect(new Status(value).valueOf()).toBe(value));
	it.each(['', 'ONLINE', 'invalid', null, undefined, 3])('rejects runtime value %s', (value) => {
		expect(() => new Modality(value as string)).toThrow();
		expect(() => new Status(value as string)).toThrow();
	});
});
