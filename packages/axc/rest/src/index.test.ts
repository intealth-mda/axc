import { buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

const app = createRestApp(buildApplicationServicesFactory({ environment: 'test' }));

describe('GET /api/courses', () => {
	it('returns a page', async () => {
		const res = await app.request('/api/courses');
		expect(res.status).toBe(200);
		expect(((await res.json()) as { page: number }).page).toBe(1);
	});
	it('maps ServiceError to 400', async () => {
		const res = await app.request('/api/courses?pageSize=99');
		expect(res.status).toBe(400);
		expect(((await res.json()) as { error: { code: string } }).error.code).toBe('INVALID_QUERY_PARAMETER');
	});
});
