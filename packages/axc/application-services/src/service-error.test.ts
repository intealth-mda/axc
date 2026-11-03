import { expect, it } from 'vitest';
import { ServiceError } from './service-error.ts';

it('carries code and details, defaulting to none', () => {
	expect(new ServiceError('INVALID_REQUEST', 'm')).toMatchObject({ code: 'INVALID_REQUEST', details: [], message: 'm' });
});
