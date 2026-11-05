import { describe, expect, it } from 'vitest';
import { ServiceError } from './service-error.ts';

describe('ServiceError', () => {
	it('carries code and details', () => {
		const e = new ServiceError('INVALID_REQUEST', 'bad', [{ field: 'f', message: 'm' }]);
		expect(e).toBeInstanceOf(Error);
		expect([e.code, e.message, e.details]).toEqual(['INVALID_REQUEST', 'bad', [{ field: 'f', message: 'm' }]]);
		expect(new ServiceError('COURSE_NOT_FOUND', 'x').details).toEqual([]);
	});
});
