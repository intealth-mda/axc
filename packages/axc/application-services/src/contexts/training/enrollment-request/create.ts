import { type EnrollmentRequestEntityReference, Justification, LearnerEmail, requiredText, WorkflowError } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
export interface EnrollmentCreateCommand {
	courseId: string;
	learnerEmail: string;
	justification: string;
}
export const create =
	(dataSources: DataSources) =>
	async (command: EnrollmentCreateCommand): Promise<EnrollmentRequestEntityReference> => {
		if (!command || typeof command !== 'object' || Array.isArray(command)) throw new WorkflowError('INVALID_REQUEST', 'Expected a JSON object.');
		const courseId = requiredText(command.courseId, 'courseId');
		const email = new LearnerEmail(command.learnerEmail).value;
		const justification = new Justification(command.justification).value;
		let result: EnrollmentRequestEntityReference | undefined;
		await dataSources.domainDataSource.Training.EnrollmentRequest.EnrollmentRequestUnitOfWork.withScopedTransaction(async (repo) => {
			const course = await dataSources.readonlyDataSource.Training.Course.CourseReadRepo.getById(courseId);
			if (!course) throw new WorkflowError('COURSE_NOT_FOUND', 'Course not found.');
			if (course.status !== 'active') throw new WorkflowError('COURSE_NOT_ACTIVE', 'Course must be active.');
			const aggregate = await repo.getNewInstance(courseId, email, justification);
			const saved = await repo.save(aggregate);
			result = {
				id: saved.id,
				courseId: saved.courseId,
				learnerEmail: saved.learnerEmail,
				justification: saved.justification,
				status: saved.status,
				createdAt: saved.createdAt,
				updatedAt: saved.updatedAt,
				statusHistory: saved.statusHistory,
			};
		});
		if (!result) throw new Error('Request creation did not produce a result.');
		return result;
	};
