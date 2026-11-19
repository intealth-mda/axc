import { describe, expect, it } from 'vitest';
import { ServiceError } from './service-error.ts';

describe('ServiceError', () => {
	it('carries code and details', () => {
		const e = new ServiceError('INVALID_REQUEST', 'm', [{ field: 'f', message: 'x' }]);
		expect([e.code, e.message, e.details[0]?.field]).toEqual(['INVALID_REQUEST', 'm', 'f']);
		expect(new ServiceError('COURSE_NOT_FOUND', 'm').details).toEqual([]);
	});
});
