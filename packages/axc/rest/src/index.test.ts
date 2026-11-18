import { buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

describe('rest courses route', () => {
	const app = createRestApp(buildApplicationServicesFactory({ environment: 'test' }));
	it('returns 200 page', async () => {
		const res = await app.request('/api/courses?pageSize=2');
		expect(res.status).toBe(200);
		expect(((await res.json()) as { items: unknown[] }).items).toHaveLength(2);
	});
	it('maps ServiceError to 400 body', async () => {
		const res = await app.request('/api/courses?sort=bad');
		expect(res.status).toBe(400);
		expect(((await res.json()) as { error: { code: string } }).error.code).toBe('INVALID_QUERY_PARAMETER');
	});
});
