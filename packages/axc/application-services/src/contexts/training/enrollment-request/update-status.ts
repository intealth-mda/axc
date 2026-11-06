import { type EnrollmentRequestEntityReference, invalid, RequestStatus, text } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { enrollmentSnapshot } from '../../../enrollment-snapshot.ts';
import { object } from '../../../validation.ts';
export interface EnrollmentUpdateStatusCommand {
	id: string;
	status: string;
	changedBy: string;
	reason?: string;
}
export const updateStatus =
	(dataSources: DataSources) =>
	async (command: EnrollmentUpdateStatusCommand): Promise<EnrollmentRequestEntityReference> => {
		const input = object(command, ['id', 'status', 'changedBy', 'reason']);
		// biome-ignore lint/complexity/useLiteralKeys: Runtime input uses an index signature.
		const id = text(input['id'], 'id');
		// biome-ignore lint/complexity/useLiteralKeys: Runtime input uses an index signature.
		const status = new RequestStatus(input['status']).value;
		// biome-ignore lint/complexity/useLiteralKeys: Runtime input uses an index signature.
		const changedBy = text(input['changedBy'], 'changedBy');
		// biome-ignore lint/complexity/useLiteralKeys: Runtime input uses an index signature.
		const reason = input['reason'];
		if (reason !== undefined && typeof reason !== 'string') invalid('reason', 'reason must be a string.');
		let result: EnrollmentRequestEntityReference | undefined;
		await dataSources.domainDataSource.Training.EnrollmentRequest.EnrollmentRequestUnitOfWork.withScopedTransaction(async (repository) => {
			const request = await repository.getById(id);
			request.changeStatus(status, changedBy, reason);
			result = await repository.save(request);
		});
		if (!result) throw new Error('Transaction returned no result.');
		return enrollmentSnapshot(result);
	};
