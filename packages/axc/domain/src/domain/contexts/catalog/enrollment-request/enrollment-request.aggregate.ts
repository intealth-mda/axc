import * as DomainSeedwork from '@cellix/domain-seedwork/aggregate-root';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { Visa } from '@cellix/domain-seedwork/visa';
import type { CatalogPassport } from '../catalog.passport.ts';
import type { EnrollmentRequestProps, EnrollmentRequestStatus } from './enrollment-request.entity.ts';
import { EnrollmentStatusHistory } from './enrollment-request.value-objects.ts';

const transitions: Readonly<Record<EnrollmentRequestStatus, readonly EnrollmentRequestStatus[]>> = {
	pending: ['approved', 'rejected', 'cancelled'],
	approved: ['cancelled'],
	rejected: [],
	cancelled: [],
};

export class InvalidEnrollmentTransition extends Error {
	readonly fromStatus: EnrollmentRequestStatus;
	readonly toStatus: EnrollmentRequestStatus;
	public constructor(fromStatus: EnrollmentRequestStatus, toStatus: EnrollmentRequestStatus) {
		super(`Cannot change status from ${fromStatus} to ${toStatus}.`);
		this.name = 'InvalidEnrollmentTransition';
		this.fromStatus = fromStatus;
		this.toStatus = toStatus;
	}
}

export class EnrollmentRequest extends DomainSeedwork.AggregateRoot<EnrollmentRequestProps, CatalogPassport> {
	private readonly visa: Visa<CatalogPassport>;

	private constructor(props: EnrollmentRequestProps, passport: CatalogPassport, visa: Visa<CatalogPassport>) {
		super(props, passport);
		this.visa = visa;
	}

	public static getNewInstance(props: EnrollmentRequestProps, passport: CatalogPassport): EnrollmentRequest {
		const visa: Visa<CatalogPassport> = {
			determineIf: (func) => func(passport),
		};
		const history = EnrollmentStatusHistory.create(props.statusHistory);
		return new EnrollmentRequest({ ...props, statusHistory: history.entries() }, passport, visa);
	}

	public static requestNew(input: { id: string; courseId: string; learnerEmail: string; justification: string; createdAt: string }, passport: CatalogPassport): EnrollmentRequest {
		const history = EnrollmentStatusHistory.create([]).append({
			fromStatus: null,
			toStatus: 'pending',
			changedAt: input.createdAt,
			changedBy: 'system',
			reason: null,
		});
		return EnrollmentRequest.getNewInstance(
			{
				id: input.id,
				courseId: input.courseId,
				learnerEmail: input.learnerEmail,
				justification: input.justification,
				status: 'pending',
				createdAt: input.createdAt,
				updatedAt: input.createdAt,
				statusHistory: history.entries(),
			},
			passport,
		);
	}

	public allowsRead(): boolean {
		return this.visa.determineIf((permissions) => permissions.canReadCatalog);
	}

	public changeStatus(toStatus: EnrollmentRequestStatus, changedBy: string, changedAt: string, reason: string | null): void {
		if (!this.visa.determineIf((permissions) => permissions.canManageEnrollment)) {
			throw new PermissionError('Enrollment status cannot be changed.');
		}
		const allowed = transitions[this.props.status];
		if (!allowed.some((status) => status === toStatus)) {
			throw new InvalidEnrollmentTransition(this.props.status, toStatus);
		}
		const history = EnrollmentStatusHistory.create(this.props.statusHistory).append({
			fromStatus: this.props.status,
			toStatus,
			changedAt,
			changedBy,
			reason,
		});
		this.props.status = toStatus;
		this.props.updatedAt = changedAt;
		this.props.statusHistory = history.entries();
	}
}
