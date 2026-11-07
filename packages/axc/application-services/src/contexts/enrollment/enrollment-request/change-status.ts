import { Enrollment } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { ApplicationError } from '../../errors.ts';
export interface ChangeStatusCommand {
	status: string;
	changedBy: string;
	reason?: string;
}
export const changeStatus = (dataSources: DataSources) => async (id: string, command: ChangeStatusCommand) => {
	const details: { field: string; message: string }[] = [];
	if (!['pending', 'approved', 'rejected', 'cancelled'].includes(command.status)) details.push({ field: 'status', message: 'Invalid status.' });
	if (typeof command.changedBy !== 'string' || !command.changedBy.trim()) details.push({ field: 'changedBy', message: 'changedBy is required.' });
	if (command.status === 'rejected' && (typeof command.reason !== 'string' || !command.reason.trim())) details.push({ field: 'reason', message: 'reason is required for rejection.' });
	if (details.length) throw new ApplicationError('INVALID_REQUEST', details);
	let changed: Enrollment.EnrollmentRequestEntityReference | undefined;
	await dataSources.domainDataSource.Enrollment.EnrollmentRequest.EnrollmentRequestUnitOfWork.withScopedTransaction(async (repo) => {
		let entity: Enrollment.EnrollmentRequest;
		try {
			entity = await repo.get(id);
		} catch {
			throw new ApplicationError('ENROLLMENT_REQUEST_NOT_FOUND');
		}
		try {
			entity.transition(command.status as Enrollment.EnrollmentStatus, command.changedBy, command.reason ?? null, new Date().toISOString());
		} catch (error) {
			if (error instanceof Enrollment.InvalidStatusTransition) throw new ApplicationError('INVALID_STATUS_TRANSITION');
			throw error;
		}
		changed = (await repo.save(entity)).toReference();
	});
	if (!changed) throw new Error('Update failed');
	return changed;
};
