import type { DataSources } from '@axc/persistence';
import { EnrollmentRequestError, fieldErrors, isEnrollmentStatus } from './create.ts';
import { type EnrollmentFieldError, type EnrollmentRequestItem, toEnrollmentRequestItem } from './query-enrollment-requests.ts';

export interface UpdateEnrollmentRequestStatusCommand {
	id: string;
	status: string;
	changedBy: string;
	reason?: string;
}

export const updateEnrollmentRequestStatus =
	(dataSources: DataSources) =>
	async (command: UpdateEnrollmentRequestStatusCommand): Promise<EnrollmentRequestItem> => {
		const details: EnrollmentFieldError[] = [];
		if (!isEnrollmentStatus(command.status)) {
			details.push({ field: 'status', message: 'status must be one of pending, approved, rejected, cancelled.' });
		}
		if (command.changedBy.trim() === '') {
			details.push({ field: 'changedBy', message: 'changedBy is required.' });
		}
		const reason = command.reason === undefined ? null : command.reason.trim();
		if (command.status === 'rejected' && (reason === null || reason === '')) {
			details.push({ field: 'reason', message: 'reason is required when rejecting a request.' });
		}
		if (details.length > 0 || !isEnrollmentStatus(command.status)) {
			throw fieldErrors(details);
		}
		const nextStatus = command.status;

		let request: Awaited<ReturnType<DataSources['readonlyDataSource']['enrollmentRequest']['get']>>;
		try {
			request = await dataSources.readonlyDataSource.enrollmentRequest.get(command.id);
		} catch (error) {
			if (error instanceof Error && error.name === 'NotFoundError') {
				throw new EnrollmentRequestError('ENROLLMENT_REQUEST_NOT_FOUND', 404, [{ field: 'id', message: 'Enrollment request was not found.' }]);
			}
			throw error;
		}

		const changedAt = new Date().toISOString();
		try {
			request.changeStatus(nextStatus, command.changedBy.trim(), changedAt, reason === '' ? null : reason);
		} catch (error) {
			if (error instanceof Error && error.name === 'InvalidEnrollmentTransition') {
				throw new EnrollmentRequestError('INVALID_STATUS_TRANSITION', 409, [{ field: 'status', message: error.message }]);
			}
			throw error;
		}

		await dataSources.domainDataSource.enrollmentRequest.withScopedTransaction(async (repository) => {
			await repository.save(request);
		});
		return toEnrollmentRequestItem(request.props);
	};
