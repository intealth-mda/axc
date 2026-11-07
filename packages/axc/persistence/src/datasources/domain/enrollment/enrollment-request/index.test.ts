import { describe, expect, it } from 'vitest';
import { EnrollmentRequestPersistence } from './index.ts';

describe('persistence composition', () => {
	it('exposes initialized unit of work', async () => {
		const composed = EnrollmentRequestPersistence(new Map());
		await expect(
			composed.EnrollmentRequestUnitOfWork.withScopedTransaction(async () => {
				await Promise.resolve();
			}),
		).resolves.toBeUndefined();
	});
});
