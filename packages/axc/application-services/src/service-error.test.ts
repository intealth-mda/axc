import { describe, expect, it } from 'vitest';
import { ServiceError } from './service-error.ts';

describe('ServiceError', () => {
	it('carries code and details', () => {
		const e = new ServiceError('INVALID_REQUEST', 'bad', [{ field: 'x', message: 'y' }]);
		expect(e).toMatchObject({ code: 'INVALID_REQUEST', message: 'bad', details: [{ field: 'x', message: 'y' }] });
		expect(new ServiceError('COURSE_NOT_FOUND', 'm').details).toEqual([]);
	});
});
