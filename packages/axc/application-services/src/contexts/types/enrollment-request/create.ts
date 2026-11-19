import type { DataSources } from '../course/data-sources.ts';
import { EnrollmentRequestFailure } from './errors.ts';
import { type EnrollmentRequestItem, toEnrollmentRequestItem } from './item.ts';

export interface CreateEnrollmentRequestCommand {
	courseId: string;
	learnerEmail: string;
	justification: string;
}

const duplicateMessage = 'An active enrollment request already exists for this learner and course.';

export const create = (dataSources: DataSources) => {
	return async (command: CreateEnrollmentRequestCommand): Promise<EnrollmentRequestItem> => {
		try {
			const course = await dataSources.readonlyDataSource.Types.Course.CourseReadRepo.getById(command.courseId);
			if (!course) {
				throw new EnrollmentRequestFailure(404, 'COURSE_NOT_FOUND', 'Course not found.', [{ field: 'courseId', message: 'Course not found.' }]);
			}
			if (course.status !== 'active') {
				throw new EnrollmentRequestFailure(409, 'COURSE_NOT_ACTIVE', 'Course is not active.', [{ field: 'courseId', message: 'An enrollment request requires an active course.' }]);
			}

			let saved: EnrollmentRequestItem | undefined;
			await dataSources.domainDataSource.Types.EnrollmentRequest.EnrollmentRequestUnitOfWork.withScopedTransaction(async (repo) => {
				if (await repo.hasActiveRequest(command.courseId, command.learnerEmail)) {
					throw new EnrollmentRequestFailure(409, 'DUPLICATE_ACTIVE_REQUEST', duplicateMessage, [{ field: 'learnerEmail', message: duplicateMessage }]);
				}
				const created = await repo.getNewInstance(command.courseId, command.learnerEmail, command.justification, 'pending');
				saved = toEnrollmentRequestItem(await repo.save(created));
			});
			if (!saved) {
				throw new EnrollmentRequestFailure(400, 'INVALID_REQUEST', 'The request could not be completed.');
			}
			return saved;
		} catch (error) {
			if (error instanceof EnrollmentRequestFailure) {
				throw error;
			}
			throw new EnrollmentRequestFailure(400, 'INVALID_REQUEST', 'The request could not be completed.');
		}
	};
};
