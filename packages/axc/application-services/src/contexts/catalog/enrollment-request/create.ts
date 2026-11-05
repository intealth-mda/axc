import type { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';

export interface EnrollmentRequestCreateCommand {
	courseId: string;
	learnerEmail: string;
	justification: string;
}

export const create = (dataSources: DataSources) => {
	return async (command: EnrollmentRequestCreateCommand): Promise<Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestEntityReference> => {
		try {
			const course = await dataSources.readonlyDataSource.Catalog.Course.CourseReadRepo.getById(command.courseId);
			if (!course) {
				throw Object.assign(new Error('Course does not exist.'), { status: 404, code: 'COURSE_NOT_FOUND', field: 'courseId' });
			}
			if (course.status !== 'active') {
				throw Object.assign(new Error('Course is not active.'), { status: 409, code: 'COURSE_NOT_ACTIVE', field: 'courseId' });
			}
			const existing = await dataSources.readonlyDataSource.Catalog.EnrollmentRequest.EnrollmentRequestReadRepo.find(undefined, command.courseId, command.learnerEmail);
			if (existing.some((request) => request.status === 'pending' || request.status === 'approved')) {
				throw Object.assign(new Error('A learner may not have more than one pending or approved request for the same course.'), { status: 409, code: 'DUPLICATE_ACTIVE_REQUEST', field: 'learnerEmail' });
			}
			let created: Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestEntityReference | undefined;
			await dataSources.domainDataSource.Catalog.EnrollmentRequest.EnrollmentRequestUnitOfWork.withScopedTransaction(async (repo) => {
				created = await repo.save(await repo.getNewInstance(command.courseId, command.learnerEmail, command.justification, 'pending'));
			});
			if (!created) {
				throw Object.assign(new Error('Unable to save EnrollmentRequest'), { status: 400 });
			}
			return created;
		} catch (error) {
			let failure: unknown = error;
			for (let depth = 0; depth < 5 && typeof failure === 'object' && failure !== null; depth += 1) {
				if ('status' in failure) throw failure;
				failure = 'cause' in failure ? failure.cause : undefined;
			}
			throw Object.assign(error instanceof Error ? error : new Error('Unable to save EnrollmentRequest'), { status: 400 });
		}
	};
};
