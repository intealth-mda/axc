import type { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
export const update = (dataSources: DataSources) => async (id: string, input: Domain.Contexts.Training.EnrollmentRequest.UpdateEnrollmentInput) => {
	let result: Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequestEntityReference | undefined;
	await dataSources.domainDataSource.Training.EnrollmentRequest.EnrollmentRequestUnitOfWork.withScopedTransaction(async (repository) => {
		const request = await repository.get(id);
		request.updateStatus(input);
		await repository.save(request);
		result = structuredClone(request.props);
	});
	return result as Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequestEntityReference;
};
