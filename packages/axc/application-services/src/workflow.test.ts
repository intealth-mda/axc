import { createDataSources } from '@axc/persistence';
import { beforeEach, describe, expect, it } from 'vitest';
import { type ApplicationServices, buildApplicationServicesFactory } from './index.ts';

let api: ApplicationServices['Training'];
const valid = { courseId: 'course-001', learnerEmail: 'a@example.org', justification: 'x'.repeat(20) };
beforeEach(async () => {
	const dataSources = createDataSources();
	api = (await buildApplicationServicesFactory({ environment: 'test', dataSourcesFactory: () => dataSources }).forRequest()).Training;
});
describe('application boundary without REST', () => {
	it('validates every public operation with stable errors and no partial writes', async () => {
		await expect(api.Course.search({ page: '0' })).rejects.toMatchObject({ code: 'INVALID_QUERY_PARAMETER' });
		await expect(api.Course.search(null as never)).rejects.toMatchObject({ code: 'INVALID_QUERY_PARAMETER' });
		await expect(api.EnrollmentRequest.create({ ...valid, learnerEmail: 'bad' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(api.EnrollmentRequest.create(null as never)).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(api.EnrollmentRequest.getById({ id: '' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(api.EnrollmentRequest.list({ status: 'bad' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(api.EnrollmentRequest.list({ courseId: 2 } as never)).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(api.EnrollmentRequest.updateStatus({ id: 'x', status: 'bad', changedBy: 'r' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		expect(await api.EnrollmentRequest.list()).toEqual({ items: [] });
		const request = await api.EnrollmentRequest.create(valid);
		await expect(api.EnrollmentRequest.updateStatus({ id: request.id, status: 'rejected', changedBy: 'r' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		expect(await api.EnrollmentRequest.getById({ id: request.id })).toEqual(request);
	});
	it('shares injected storage across requests and returns isolated snapshots', async () => {
		const first = await api.EnrollmentRequest.create(valid);
		(first.statusHistory as unknown[]).pop();
		const retrieved = await api.EnrollmentRequest.getById({ id: first.id });
		expect(retrieved.statusHistory).toHaveLength(1);
		await expect(api.EnrollmentRequest.create(valid)).rejects.toMatchObject({ code: 'DUPLICATE_ACTIVE_REQUEST' });
	});
});
