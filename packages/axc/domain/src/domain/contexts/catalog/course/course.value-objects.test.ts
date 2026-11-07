import { describe, expect, it } from 'vitest';
import { Modality, Status } from './course.value-objects.ts';

describe('course value objects', () => {
	it('accepts every modality and status', () => {
		for (const value of ['online', 'in-person', 'hybrid']) expect(new Modality(value).valueOf()).toBe(value);
		for (const value of ['draft', 'active', 'retired']) expect(new Status(value).valueOf()).toBe(value);
	});
	it('rejects invalid runtime values', () => {
		expect(() => new Modality('remote')).toThrow();
		expect(() => new Status('pending')).toThrow();
	});
});
