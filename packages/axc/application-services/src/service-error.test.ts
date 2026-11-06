import { describe, expect, it } from 'vitest';
import { ServiceError } from './service-error.ts';

describe('ServiceError', () => {
	it('carries code and details', () => {
		const error = new ServiceError('INVALID_REQUEST', 'bad', [{ field: 'f', message: 'm' }]);
		expect(error).toMatchObject({ code: 'INVALID_REQUEST', message: 'bad', details: [{ field: 'f', message: 'm' }] });
		expect(new ServiceError('COURSE_NOT_FOUND', 'x').details).toEqual([]);
	});
});
