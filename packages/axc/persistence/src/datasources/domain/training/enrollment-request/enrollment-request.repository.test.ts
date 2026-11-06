import { describe, expect, it } from 'vitest';
import { EnrollmentRequestConverter } from './enrollment-request.domain-adapter.ts';
import { EnrollmentRequestRepository } from './enrollment-request.repository.ts';

describe('enrollment repository', () => {
	it('creates, saves and rehydrates through converter; enforces active uniqueness', async () => {
		const repository = new EnrollmentRequestRepository(new Map(), new EnrollmentRequestConverter());
		const course = { id: 'c', status: 'active' } as never;
		const request = await repository.getNewInstance(course, 'a@example.org', 'x'.repeat(20));
		const saved = await repository.save(request);
		expect(saved.id).toMatch(/^enroll-/);
		expect((await repository.get(saved.id)).props).toEqual(request.props);
		const duplicate = await repository.getNewInstance(course, 'A@EXAMPLE.ORG', 'x'.repeat(20));
		await expect(repository.save(duplicate)).rejects.toMatchObject({ code: 'DUPLICATE_ACTIVE_REQUEST' });
		saved.changeStatus('approved', 'r');
		await repository.save(saved);
		await expect(repository.save(duplicate)).rejects.toMatchObject({ code: 'DUPLICATE_ACTIVE_REQUEST' });
		saved.changeStatus('cancelled', 'r');
		await repository.save(saved);
		await expect(repository.save(duplicate)).resolves.toHaveProperty('status', 'pending');
		await expect(repository.getById('missing')).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
	});
});
