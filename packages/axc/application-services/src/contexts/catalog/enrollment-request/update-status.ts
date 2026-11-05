import type { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';

export interface EnrollmentRequestUpdateStatusCommand {
	id: string;
	status: 'pending' | 'approved' | 'rejected' | 'cancelled';
	changedBy: string;
	reason?: string;
}

export const updateStatus = (dataSources: DataSources) => {
	return async (command: EnrollmentRequestUpdateStatusCommand): Promise<Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestEntityReference> => {
		try {
			let updated: Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestEntityReference | undefined;
			await dataSources.domainDataSource.Catalog.EnrollmentRequest.EnrollmentRequestUnitOfWork.withScopedTransaction(async (repo) => {
				const current = await repo.getById(command.id);
				if (!current) {
					throw Object.assign(new Error('Enrollment request does not exist.'), { status: 404, code: 'ENROLLMENT_REQUEST_NOT_FOUND', field: 'id' });
				}
				if (command.changedBy.trim() === '') {
					throw Object.assign(new Error('changedBy is required.'), { status: 400, code: 'INVALID_REQUEST', field: 'changedBy' });
				}
				if (command.status === 'rejected' && (command.reason === undefined || command.reason.trim() === '')) {
					throw Object.assign(new Error('reason is required when rejecting a request.'), { status: 400, code: 'INVALID_REQUEST', field: 'reason' });
				}
				const request = current as unknown as {
					prepareStatusChange: (changedBy: string, reason: string | null) => void;
					status: 'pending' | 'approved' | 'rejected' | 'cancelled';
				};
				request.prepareStatusChange(command.changedBy, command.reason === undefined ? null : command.reason);
				request.status = command.status;
				updated = await repo.save(current);
			});
			if (!updated) {
				throw Object.assign(new Error('Unable to update EnrollmentRequest'), { status: 404 });
			}
			return updated;
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
