import type { EnrollmentRequestEntityReference } from '@axc/domain';
import type { MemoryStore } from '../../../store.ts';

interface EnrollmentFilter {
	status?: string;
	courseId?: string;
	learnerEmail?: string;
}
export interface EnrollmentRequestReadRepository {
	getById(id: string): Promise<EnrollmentRequestEntityReference | undefined>;
	list(query: EnrollmentFilter): Promise<EnrollmentRequestEntityReference[]>;
}
export const getEnrollmentRequestReadRepository = (store: MemoryStore): EnrollmentRequestReadRepository => ({
	getById: async (id) => {
		const record = store.enrollments.get(id);
		return await Promise.resolve(record ? structuredClone(record) : undefined);
	},
	list: async (query) =>
		structuredClone(
			[...store.enrollments.values()].filter((row) => (!query.status || row.status === query.status) && (!query.courseId || row.courseId === query.courseId) && (!query.learnerEmail || row.learnerEmail === query.learnerEmail)),
		),
});
