import { describe, expect, it } from 'vitest';
import { invalid } from './service-error.ts';

describe('ServiceError', () => {
	it('builds INVALID_REQUEST with details', () => {
		const e = invalid([{ field: 'f', message: 'm' }]);
		expect(e.code).toBe('INVALID_REQUEST');
		expect(e.details).toEqual([{ field: 'f', message: 'm' }]);
	});
});
