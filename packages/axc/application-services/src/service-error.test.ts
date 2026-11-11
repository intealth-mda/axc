import { expect, it } from 'vitest';
import { ServiceError } from './service-error.ts';

it('carries code and details', () => {
	const e = new ServiceError('INVALID_QUERY_PARAMETER', 'm', [{ field: 'page', message: 'x' }]);
	expect([e.code, e.details[0]?.field]).toEqual(['INVALID_QUERY_PARAMETER', 'page']);
});
