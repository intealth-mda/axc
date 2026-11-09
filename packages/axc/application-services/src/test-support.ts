import { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { NotFoundError } from '@cellix/domain-seedwork/repository';

type Props = Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequestProps;
export const validInput = { courseId: 'course-001', learnerEmail: 'learner@example.org', justification: 'I need this course for my upcoming project.' };
export function fixture() {
	const store = new Map<string, Props>();
	const reads: unknown[] = [];
	let courseStatus = 'active';
	let saved = 0;
	const repository = {
		get: (id: string) => {
			const p = store.get(id);
			if (!p) throw new NotFoundError('Missing request');
			return Promise.resolve(new Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequest(structuredClone(p), { visa: {} }));
		},
		getNewInstance: (input: typeof validInput) => Promise.resolve(Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequest.getNewInstance({ id: 'enroll-001' } as Props, { visa: {} }, input)),
		hasActive: (courseId: string, learnerEmail: string) =>
			Promise.resolve([...store.values()].some((r) => r.courseId === courseId && r.learnerEmail === learnerEmail.trim().toLowerCase() && ['pending', 'approved'].includes(r.status))),
		save: (r: Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequest<Props>) => {
			saved++;
			store.set(r.id, structuredClone(r.props));
			return Promise.resolve(r);
		},
	};
	const dataSources: DataSources = {
		readonlyDataSource: {
			Training: {
				Course: {
					CourseReadRepo: {
						getById: (id) =>
							Promise.resolve(
								id === 'course-001'
									? ({ id, title: 'Course', summary: 'Summary', modality: 'online', status: courseStatus, tags: [], createdAt: '', updatedAt: '' } as Domain.Contexts.Training.Course.CourseEntityReference)
									: undefined,
							),
						search: (query) => {
							reads.push(query);
							return Promise.resolve({ items: [], page: query.page, pageSize: query.pageSize, totalItems: 0, totalPages: 0 });
						},
					},
				},
				EnrollmentRequest: {
					EnrollmentRequestReadRepo: {
						getById: (id) => Promise.resolve(structuredClone(store.get(id))),
						list: (filter) => {
							reads.push(filter);
							return Promise.resolve([...store.values()]);
						},
					},
				},
			},
		},
		domainDataSource: {
			Training: {
				EnrollmentRequest: {
					EnrollmentRequestUnitOfWork: {
						withScopedTransaction: (callback) => callback(repository),
						withTransaction: (_passport, callback) => callback(repository),
						withScopedTransactionById: async (id, callback) => {
							await callback(repository);
							return await repository.get(id);
						},
					},
				},
			},
		},
	};
	return {
		dataSources,
		store,
		reads,
		get saved() {
			return saved;
		},
		setCourseStatus: (value: string) => {
			courseStatus = value;
		},
	};
}
