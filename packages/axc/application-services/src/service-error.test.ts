import { expect, it } from 'vitest';
import { ServiceError } from './service-error.ts';

it('carries code and details', () => {
	const e = new ServiceError('INVALID_REQUEST', 'm', [{ field: 'f', message: 'x' }]);
	expect([e.code, e.details[0]?.field, e.message]).toEqual(['INVALID_REQUEST', 'f', 'm']);
});
