import { expect, it } from 'vitest';
import { ServiceError } from './service-error.ts';

it('carries code and details', () => {
	const e = new ServiceError('INVALID_QUERY_PARAMETER', 'm', [{ field: 'f', message: 'x' }]);
	expect([e.code, e.message, e.details[0]?.field]).toEqual(['INVALID_QUERY_PARAMETER', 'm', 'f']);
});
