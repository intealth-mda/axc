import type { EnrollmentRequestEntityReference } from '@axc/domain';

export interface StatusHistoryItem {
	fromStatus: string | null;
	toStatus: string;
	changedAt: string;
	changedBy: string;
	reason: string | null;
}

export interface EnrollmentRequestItem {
	id: string;
	courseId: string;
	learnerEmail: string;
	justification: string;
	status: string;
	createdAt: string;
	updatedAt: string;
	statusHistory: StatusHistoryItem[];
}

export function toEnrollmentRequestItem(entity: EnrollmentRequestEntityReference): EnrollmentRequestItem {
	return {
		id: entity.id,
		courseId: entity.courseId,
		learnerEmail: entity.learnerEmail,
		justification: entity.justification,
		status: entity.status,
		createdAt: entity.createdAt.toISOString(),
		updatedAt: entity.updatedAt.toISOString(),
		statusHistory: entity.statusHistory.map((entry) => ({
			fromStatus: entry.fromStatus,
			toStatus: entry.toStatus,
			changedAt: entry.changedAt,
			changedBy: entry.changedBy,
			reason: entry.reason,
		})),
	};
}
