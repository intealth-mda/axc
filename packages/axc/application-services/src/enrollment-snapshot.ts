import type { EnrollmentRequestEntityReference } from '@axc/domain';
export const enrollmentSnapshot = (request: EnrollmentRequestEntityReference): EnrollmentRequestEntityReference => ({
	id: request.id,
	courseId: request.courseId,
	learnerEmail: request.learnerEmail,
	justification: request.justification,
	status: request.status,
	createdAt: request.createdAt,
	updatedAt: request.updatedAt,
	statusHistory: request.statusHistory.map((entry) => ({ ...entry })),
});
