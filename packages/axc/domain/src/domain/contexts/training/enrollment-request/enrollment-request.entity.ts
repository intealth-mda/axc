import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type { EnrollmentStatus } from './enrollment-request.value-objects.ts';
export interface StatusHistoryEntry {
	fromStatus: EnrollmentStatus | null;
	toStatus: EnrollmentStatus;
	changedAt: string;
	changedBy: string;
	reason: string | null;
}
export interface EnrollmentRequestProps extends DomainEntityProps {
	courseId: string;
	learnerEmail: string;
	justification: string;
	status: EnrollmentStatus;
	createdAt: string;
	updatedAt: string;
	statusHistory: StatusHistoryEntry[];
}
export type EnrollmentRequestEntityReference = Readonly<EnrollmentRequestProps>;
