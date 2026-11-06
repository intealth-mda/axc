import * as DomainSeedwork from '@cellix/domain-seedwork/aggregate-root';
import type { Passport, Visa } from '../../passport.ts';
import type { EnrollmentRequestProps } from './enrollment-request.entity.ts';
import { assertCreateEnrollment, assertUpdateEnrollment, type CreateEnrollmentInput, EnrollmentConflictError, type UpdateEnrollmentInput } from './enrollment-request.value-objects.ts';
export class EnrollmentRequest<P extends EnrollmentRequestProps> extends DomainSeedwork.AggregateRoot<P, Passport> {
	static getNewInstance<P extends EnrollmentRequestProps>(newProps: P, passport: Passport, input: CreateEnrollmentInput): EnrollmentRequest<P> {
		assertCreateEnrollment(input);
		const now = new Date().toISOString();
		Object.assign(newProps, {
			courseId: input.courseId.trim(),
			learnerEmail: input.learnerEmail.trim().toLowerCase(),
			justification: input.justification.trim(),
			status: 'pending',
			createdAt: now,
			updatedAt: now,
			statusHistory: [{ fromStatus: null, toStatus: 'pending', changedAt: now, changedBy: 'system', reason: null }],
		});
		return new EnrollmentRequest(newProps, passport);
	}
	protected get visa(): Visa {
		return this.passport.visa;
	}
	updateStatus(input: UpdateEnrollmentInput): void {
		assertUpdateEnrollment(input);
		const fromStatus = this.props.status;
		if (!((fromStatus === 'pending' && ['approved', 'rejected', 'cancelled'].includes(input.status)) || (fromStatus === 'approved' && input.status === 'cancelled'))) throw new EnrollmentConflictError('INVALID_STATUS_TRANSITION');
		const now = new Date().toISOString();
		this.props.statusHistory.push({ fromStatus, toStatus: input.status, changedAt: now, changedBy: input.changedBy.trim(), reason: input.reason?.trim() || null });
		this.props.status = input.status;
		this.props.updatedAt = now;
	}
}
