import { type ApplicationServicesFactory, buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it, vi } from 'vitest';
import { createRestApp } from './index.ts';

function spyFactory(): ApplicationServicesFactory {
	const factory = buildApplicationServicesFactory({ environment: 'test' });
	vi.spyOn(factory, 'forRequest');
	return factory;
}

describe('createRestApp', () => {
	it('GET /health returns 200 with the health contract for the configured environment', async () => {
		const res = await createRestApp(buildApplicationServicesFactory({ environment: 'test' })).request('/health');

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({
			status: 'ok',
			service: 'agentCourses-api',
			projectCode: 'axc',
			environment: 'test',
			timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
		});
	});

	it('calls forRequest with no argument when the Authorization header is absent', async () => {
		const factory = spyFactory();

		await createRestApp(factory).request('/health');

		expect(factory.forRequest).toHaveBeenCalledTimes(1);
		expect(factory.forRequest).toHaveBeenCalledWith();
	});

	it('passes the Authorization header to forRequest when it is present', async () => {
		const factory = spyFactory();

		const res = await createRestApp(factory).request('/health', { headers: { Authorization: 'Bearer abc' } });

		expect(res.status).toBe(200);
		expect(factory.forRequest).toHaveBeenCalledTimes(1);
		expect(factory.forRequest).toHaveBeenCalledWith('Bearer abc');
	});
});
