import { describe, expect, it } from 'vitest';
import { EnrollmentRequestConverter } from './enrollment-request.domain-adapter.ts';

describe('converter', () => {
	it('round trips history and isolates source', () => {
		const converter = new EnrollmentRequestConverter();
		const aggregate = converter.toDomain({
			id: 'e',
			courseId: 'c',
			learnerEmail: 'u@e.org',
			justification: 'This course supports my work.',
			status: 'approved',
			createdAt: 'a',
			updatedAt: 'b',
			statusHistory: [
				{ fromStatus: null, toStatus: 'pending', changedAt: 'a', changedBy: 'system', reason: null },
				{ fromStatus: 'pending', toStatus: 'approved', changedAt: 'b', changedBy: 'r', reason: null },
			],
		});
		const record = converter.toRecord(aggregate);
		expect(record.statusHistory[1]?.toStatus).toBe('approved');
		aggregate.statusHistory.push({ fromStatus: null, toStatus: 'pending', changedAt: 'x', changedBy: 'x', reason: null });
		expect(record.statusHistory).toHaveLength(2);
	});
});
