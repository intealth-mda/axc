import { describe, expect, it } from 'vitest';
import { ServiceError } from './service-error.ts';

describe('ServiceError', () => {
	it('carries code and details', () => {
		const e = new ServiceError('INVALID_REQUEST', 'bad', [{ field: 'f', message: 'm' }]);
		expect([e.code, e.message, e.details.length]).toEqual(['INVALID_REQUEST', 'bad', 1]);
		expect(new ServiceError('COURSE_NOT_FOUND', 'x').details).toEqual([]);
	});
});
