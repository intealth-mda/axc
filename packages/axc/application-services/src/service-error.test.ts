import { describe, expect, it } from 'vitest';
import { ServiceError } from './service-error.ts';

describe('ServiceError', () => {
	it('carries code and details', () => {
		const e = new ServiceError('INVALID_QUERY_PARAMETER', 'm', [{ field: 'f', message: 'x' }]);
		expect(e).toMatchObject({ code: 'INVALID_QUERY_PARAMETER', message: 'm', details: [{ field: 'f' }] });
	});
});
