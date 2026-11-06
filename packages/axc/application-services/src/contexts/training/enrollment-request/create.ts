import { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
export const create = (dataSources: DataSources) => async (input: Domain.Contexts.Training.EnrollmentRequest.CreateEnrollmentInput) => {
	const { EnrollmentConflictError } = Domain.Contexts.Training.EnrollmentRequest;
	let result: Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequestEntityReference | undefined;
	await dataSources.domainDataSource.Training.EnrollmentRequest.EnrollmentRequestUnitOfWork.withScopedTransaction(async (repository) => {
		const request = await repository.getNewInstance(input);
		const course = await dataSources.readonlyDataSource.Training.Course.CourseReadRepo.getById(request.props.courseId);
		if (!course) throw new NotFoundError('Course not found.');
		if (course.status !== 'active') throw new EnrollmentConflictError('COURSE_NOT_ACTIVE');
		if (await repository.hasActive(request.props.courseId, request.props.learnerEmail)) throw new EnrollmentConflictError('DUPLICATE_ACTIVE_REQUEST');
		await repository.save(request);
		result = structuredClone(request.props);
	});
	return result as Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequestEntityReference;
};
