import { expect, it } from 'vitest';
import { ServiceError } from './service-error.ts';

it('carries code and details', () => {
	const e = new ServiceError('INVALID_QUERY_PARAMETER', 'bad', [{ field: 'page', message: 'x' }]);
	expect(e.code).toBe('INVALID_QUERY_PARAMETER');
	expect(e.details[0]?.field).toBe('page');
});
