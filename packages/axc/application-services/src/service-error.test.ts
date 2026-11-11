import { describe, expect, it } from 'vitest';
import { ServiceError } from './service-error.ts';

describe('ServiceError', () => {
	it('carries code and details', () => {
		const e = new ServiceError('INVALID_REQUEST', 'bad', [{ field: 'x', message: 'm' }]);
		expect([e.code, e.message, e.details.length, new ServiceError('COURSE_NOT_FOUND', 'n').details]).toEqual(['INVALID_REQUEST', 'bad', 1, []]);
	});
});
