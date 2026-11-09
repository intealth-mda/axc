import type { EnrollmentRequestRecord } from '@axc/data-sources-mongoose-models';
import { expect, it } from 'vitest';
import { EnrollmentRequestConverter } from './enrollment-request.domain-adapter.ts';
import { EnrollmentRequestRepository } from './enrollment-request.repository.ts';

it('creates through the factory, retrieves and saves through conversion without shared references', async () => {
	const records = new Map<string, EnrollmentRequestRecord>();
	const repo = new EnrollmentRequestRepository(records, new EnrollmentRequestConverter());
	const item = await repo.getNewInstance('c', 'A@B.org', 'x'.repeat(20));
	expect(item.status).toBe('pending');
	expect(item.learnerEmail).toBe('a@b.org');
	await repo.save(item);
	const expected = new EnrollmentRequestConverter().toRecord(item);
	expect(records.get(item.id)).toEqual(expected);
	const read = await repo.get(item.id);
	read.changeStatus('approved', 'reviewer', undefined, '2026-07-01T00:00:00.000Z');
	expect(records.get(item.id)).toEqual(expected);
	await repo.save(read);
	const stored = structuredClone(records.get(item.id));
	read.props.statusHistory = [];
	read.props.courseId = 'tamper';
	expect(records.get(item.id)).toEqual(stored);
	expect((await repo.getById(item.id)).statusHistory).toHaveLength(2);
	await expect(repo.get('missing')).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
});
it.each(['pending', 'approved'])('prevents duplicate %s while allowing a different learner/course', async (status) => {
	const records = new Map<string, EnrollmentRequestRecord>();
	const repo = new EnrollmentRequestRepository(records, new EnrollmentRequestConverter());
	const first = await repo.getNewInstance('c', 'a@b.org', 'x'.repeat(20));
	if (status === 'approved') first.changeStatus(status, 'reviewer', undefined, new Date().toISOString());
	await repo.save(first);
	await expect(repo.save(await repo.getNewInstance('c', 'a@b.org', 'x'.repeat(20)))).rejects.toMatchObject({ code: 'DUPLICATE_ACTIVE_REQUEST' });
	await repo.save(await repo.getNewInstance('other', 'a@b.org', 'x'.repeat(20)));
	await repo.save(await repo.getNewInstance('c', 'different@b.org', 'x'.repeat(20)));
	expect(records.size).toBe(3);
});
