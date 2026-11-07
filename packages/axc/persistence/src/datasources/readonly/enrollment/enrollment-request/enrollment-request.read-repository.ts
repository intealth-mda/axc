import type { EnrollmentRequestRecord } from '@axc/data-sources-mongoose-models';
import type { Enrollment } from '@axc/domain';

export interface EnrollmentRequestReadRepository {
	getById(id: string): Promise<Enrollment.EnrollmentRequestEntityReference | null>;
	list(filters: { status?: string | undefined; courseId?: string | undefined; learnerEmail?: string | undefined }): Promise<Enrollment.EnrollmentRequestEntityReference[]>;
}
const copy = (x: EnrollmentRequestRecord): Enrollment.EnrollmentRequestEntityReference => ({
	...x,
	statusHistory: x.statusHistory.map((y) => ({ ...y, toStatus: y.toStatus as Enrollment.EnrollmentStatus, fromStatus: y.fromStatus as Enrollment.EnrollmentStatus | null })),
});
export const EnrollmentRequestReadRepositoryImpl = (records: Map<string, EnrollmentRequestRecord>): EnrollmentRequestReadRepository => ({
	getById(id) {
		const x = records.get(id);
		return Promise.resolve(x ? copy(x) : null);
	},
	list(filters) {
		return Promise.resolve(
			[...records.values()].filter((x) => (!filters.status || x.status === filters.status) && (!filters.courseId || x.courseId === filters.courseId) && (!filters.learnerEmail || x.learnerEmail === filters.learnerEmail)).map(copy),
		);
	},
});
