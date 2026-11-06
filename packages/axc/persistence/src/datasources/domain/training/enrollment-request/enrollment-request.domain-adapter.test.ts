import { EnrollmentRequest } from '@axc/domain';
import { describe, expect, it } from 'vitest';
import { EnrollmentRequestConverter } from './enrollment-request.domain-adapter.ts';

describe('enrollment adapter/converter', () => {
	it('round trips every field and nested history with defensive copies', () => {
		const converter = new EnrollmentRequestConverter();
		const aggregate = EnrollmentRequest.getNewInstance({ id: 'e' } as never, { id: 'c', status: 'active' } as never, 'a@example.org', 'x'.repeat(20));
		aggregate.changeStatus('rejected', 'reviewer', 'Prerequisites missing');
		const stored = converter.toPersistence(aggregate);
		const restored = converter.toDomain(stored);
		expect(converter.toPersistence(restored)).toEqual(converter.toPersistence(aggregate));
		expect(restored.statusHistory).toEqual(aggregate.statusHistory);
		stored.statusHistory.pop();
		stored.learnerEmail = 'other@example.org';
		expect(restored.learnerEmail).toBe('a@example.org');
		expect(restored.statusHistory).toHaveLength(2);
		const adapter = converter.toAdapter(restored);
		expect(adapter).toEqual(restored.props);
	});
});
