import { type EnrollmentRequestEntityReference, EnrollmentStatus, requiredText, WorkflowError } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
export interface EnrollmentChangeStatusCommand {
	id: string;
	status: string;
	changedBy: string;
	reason?: string;
}
export const changeStatus =
	(dataSources: DataSources) =>
	async (command: EnrollmentChangeStatusCommand): Promise<EnrollmentRequestEntityReference> => {
		if (!command || typeof command !== 'object' || Array.isArray(command)) throw new WorkflowError('INVALID_REQUEST', 'Expected a JSON object.');
		const id = requiredText(command.id, 'id');
		const status = new EnrollmentStatus(command.status).value;
		const actor = requiredText(command.changedBy, 'changedBy');
		const reason = command.reason === undefined ? undefined : requiredText(command.reason, 'reason');
		if (status === 'rejected' && !reason) throw new WorkflowError('INVALID_REQUEST', 'Rejection requires a reason.', 'reason');
		let result: EnrollmentRequestEntityReference | undefined;
		await dataSources.domainDataSource.Training.EnrollmentRequest.EnrollmentRequestUnitOfWork.withScopedTransaction(async (repo) => {
			const aggregate = await repo.getById(id);
			aggregate.changeStatus(status, actor, reason, new Date().toISOString());
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
		if (!result) throw new Error('Status change did not produce a result.');
		return result;
	};
