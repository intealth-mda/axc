import { describe, expect, it } from 'vitest';
import { ServiceError } from './service-error.ts';

describe('ServiceError', () => {
	it('carries code and details', () => {
		const e = new ServiceError('INVALID_REQUEST', 'bad', [{ field: 'f', message: 'm' }]);
		expect([e.code, e.details.length, e.details[0]?.field]).toEqual(['INVALID_REQUEST', 1, 'f']);
		expect(new ServiceError('COURSE_NOT_FOUND', 'x').details).toEqual([]);
	});
});
