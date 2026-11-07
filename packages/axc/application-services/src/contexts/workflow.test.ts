import { buildDataSources } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { Catalog } from './catalog/index.ts';
import { Enrollment } from './enrollment/index.ts';

describe('application workflow', () => {
	it('validates direct course query inputs', async () => {
		const service = Catalog(buildDataSources()).Course;
		await expect(service.search({ pageSize: 51 })).rejects.toMatchObject({ code: 'INVALID_QUERY_PARAMETER', details: [{ field: 'pageSize' }] });
	});
	it('validates direct commands and filters, preserving state after rejected commands', async () => {
		const sources = buildDataSources();
		const service = Enrollment(sources).EnrollmentRequest;
		await expect(service.create({ courseId: 'course-001', learnerEmail: 'invalid', justification: 'This course supports my work.' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		const item = await service.create({ courseId: 'course-001', learnerEmail: 'USER@example.org', justification: 'This course supports my work.' });
		await expect(service.create({ courseId: 'course-001', learnerEmail: 'user@example.org', justification: 'This course supports my work.' })).rejects.toMatchObject({ code: 'DUPLICATE_ACTIVE_REQUEST' });
		await expect(service.list({ status: 'invalid' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(service.changeStatus(item.id, { status: 'pending', changedBy: 'reviewer' })).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
		await expect(service.changeStatus(item.id, { status: 'rejected', changedBy: 'reviewer' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		expect((await service.getById(item.id)).statusHistory).toHaveLength(1);
	});
});
