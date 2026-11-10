import { buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

const app = createRestApp(buildApplicationServicesFactory({ environment: 'test' }));

async function requestJson(path: string): Promise<{ status: number; body: unknown }> {
	const response = await app.request(path);
	const body: unknown = await response.json();
	return { status: response.status, body };
}

describe('GET /api/courses', () => {
	it('returns the default catalog page', async () => {
		const { status, body } = await requestJson('/api/courses');
		expect(status).toBe(200);
		expect(body).toMatchObject({
			page: 1,
			pageSize: 10,
			totalItems: 12,
			totalPages: 2,
		});
	});

	it('returns 400 for an invalid pageSize', async () => {
		const { status, body } = await requestJson('/api/courses?pageSize=51');
		expect(status).toBe(400);
		expect(body).toEqual({
			error: {
				code: 'INVALID_QUERY_PARAMETER',
				message: 'One or more query parameters are invalid.',
				details: [{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' }],
			},
		});
	});

	it('returns an empty list when nothing matches', async () => {
		const { status, body } = await requestJson('/api/courses?q=zzzz-no-such-course');
		expect(status).toBe(200);
		expect(body).toEqual({
			items: [],
			page: 1,
			pageSize: 10,
			totalItems: 0,
			totalPages: 0,
		});
	});
});
