import type { Domain } from '@axc/domain';

type Enrollment = Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequestEntityReference;
type Filter = Domain.Contexts.Training.EnrollmentRequest.EnrollmentFilter;
export interface EnrollmentRequestReadRepository {
	getById(id: string): Promise<Enrollment | undefined>;
	list(filter: Filter): Promise<Enrollment[]>;
}
export const enrollmentRequestReadRepository = (store: Map<string, Enrollment>): EnrollmentRequestReadRepository => ({
	getById: (id) => Promise.resolve(structuredClone(store.get(id))),
	list: (filter) =>
		Promise.resolve(
			structuredClone(
				[...store.values()].filter(
					(item) =>
						(filter.status === undefined || item.status === filter.status) &&
						(filter.courseId === undefined || item.courseId === filter.courseId) &&
						(filter.learnerEmail === undefined || item.learnerEmail === filter.learnerEmail.trim().toLowerCase()),
				),
			),
		),
});
