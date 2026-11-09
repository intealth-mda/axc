import type { EnrollmentRequestRecord } from '@axc/data-sources-mongoose-models';
import { expect, it } from 'vitest';
import { EnrollmentRequestConverter } from './enrollment-request.domain-adapter.ts';

const record: EnrollmentRequestRecord = {
	id: 'e',
	courseId: 'c',
	learnerEmail: 'a@b.org',
	justification: 'x'.repeat(20),
	status: 'approved',
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-02T00:00:00.000Z',
	statusHistory: [
		{ fromStatus: null, toStatus: 'pending', changedAt: '2026-01-01T00:00:00.000Z', changedBy: 'system', reason: null },
		{ fromStatus: 'pending', toStatus: 'approved', changedAt: '2026-01-02T00:00:00.000Z', changedBy: 'reviewer', reason: 'Ready' },
	],
};
it('maps every field and round trips nested history in both directions', () => {
	const converter = new EnrollmentRequestConverter();
	const domain = converter.toDomain(record);
	expect(converter.toRecord(domain)).toEqual(record);
	expect(converter.toRecord(converter.toDomain(converter.toRecord(domain)))).toEqual(record);
	expect(domain.statusHistory).toEqual(record.statusHistory);
	expect(domain.id).toBe(record.id);
});
it('copies incoming stored state and outgoing converted records', () => {
	const converter = new EnrollmentRequestConverter();
	const source = structuredClone(record);
	const item = converter.toDomain(source);
	const sourceEntry = source.statusHistory[0];
	if (!sourceEntry) throw new Error('Missing history');
	sourceEntry.changedBy = 'source changed';
	source.courseId = 'other';
	expect(item.courseId).toBe('c');
	expect(item.statusHistory[0]?.changedBy).toBe('system');
	const saved = converter.toRecord(item);
	const savedEntry = saved.statusHistory[0];
	if (!savedEntry) throw new Error('Missing history');
	savedEntry.changedBy = 'saved changed';
	saved.courseId = 'other';
	expect(item.courseId).toBe('c');
	expect(item.statusHistory[0]?.changedBy).toBe('system');
	expect(record.statusHistory[0]?.changedBy).toBe('system');
});
