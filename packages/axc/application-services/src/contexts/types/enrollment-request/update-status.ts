import { canTransitionEnrollmentRequestStatus, isEnrollmentRequestStatus } from '@axc/domain';
import type { DataSources } from '../course/data-sources.ts';
import { EnrollmentRequestFailure } from './errors.ts';
import { type EnrollmentRequestItem, toEnrollmentRequestItem } from './item.ts';

export interface UpdateEnrollmentRequestStatusCommand {
	id: string;
	status: string;
	changedBy: string;
	reason: string | null;
}

const invalidRequest = 'The request could not be completed.';

export const updateStatus = (dataSources: DataSources) => {
	return async (command: UpdateEnrollmentRequestStatusCommand): Promise<EnrollmentRequestItem> => {
		try {
			if (!isEnrollmentRequestStatus(command.status)) {
				throw new EnrollmentRequestFailure(400, 'INVALID_REQUEST', invalidRequest, [{ field: 'status', message: 'status must be one of pending, approved, rejected, cancelled.' }]);
			}
			let saved: EnrollmentRequestItem | undefined;
			await dataSources.domainDataSource.Types.EnrollmentRequest.EnrollmentRequestUnitOfWork.withScopedTransaction(async (repo) => {
				const current = await repo.getById(command.id);
				if (!canTransitionEnrollmentRequestStatus(current.status, command.status)) {
					throw new EnrollmentRequestFailure(409, 'INVALID_STATUS_TRANSITION', 'The status transition is not allowed.', [{ field: 'status', message: `status cannot change from ${current.status} to ${command.status}.` }]);
				}
				if (command.status === 'rejected' && command.reason === null) {
					throw new EnrollmentRequestFailure(400, 'INVALID_REQUEST', invalidRequest, [{ field: 'reason', message: 'reason is required when rejecting an enrollment request.' }]);
				}
				const fromStatus = current.status;
				const at = new Date();
				current.status = command.status;
				current.addStatusHistory(
					{
						fromStatus,
						toStatus: command.status,
						changedBy: command.changedBy,
						reason: command.reason,
					},
					at,
				);
				saved = toEnrollmentRequestItem(await repo.save(current));
			});
			if (!saved) {
				throw new EnrollmentRequestFailure(404, 'ENROLLMENT_REQUEST_NOT_FOUND', 'Enrollment request not found.', [{ field: 'id', message: 'Enrollment request not found.' }]);
			}
			return saved;
		} catch (error) {
			if (error instanceof EnrollmentRequestFailure) {
				throw error;
			}
			throw new EnrollmentRequestFailure(400, 'INVALID_REQUEST', invalidRequest);
		}
	};
};
