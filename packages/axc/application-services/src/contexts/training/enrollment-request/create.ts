import { type EnrollmentRequestEntityReference, Justification, LearnerEmail, RuleError, text } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { enrollmentSnapshot } from '../../../enrollment-snapshot.ts';
import { object } from '../../../validation.ts';
export interface EnrollmentCreateCommand {
	courseId: string;
	learnerEmail: string;
	justification: string;
}
export const create =
	(dataSources: DataSources) =>
	async (command: EnrollmentCreateCommand): Promise<EnrollmentRequestEntityReference> => {
		const input = object(command, ['courseId', 'learnerEmail', 'justification']);
		// biome-ignore lint/complexity/useLiteralKeys: Runtime input uses an index signature.
		const id = text(input['courseId'], 'courseId');
		// biome-ignore lint/complexity/useLiteralKeys: Runtime input uses an index signature.
		const email = new LearnerEmail(input['learnerEmail']).value;
		// biome-ignore lint/complexity/useLiteralKeys: Runtime input uses an index signature.
		const justification = new Justification(input['justification']).value;
		const course = await dataSources.readonlyDataSource.Training.Course.CourseReadRepo.getById(id);
		if (!course) throw new RuleError('COURSE_NOT_FOUND', 'Course not found.');
		let result: EnrollmentRequestEntityReference | undefined;
		await dataSources.domainDataSource.Training.EnrollmentRequest.EnrollmentRequestUnitOfWork.withScopedTransaction(async (repository) => {
			const request = await repository.getNewInstance(course, email, justification);
			result = await repository.save(request);
		});
		if (!result) throw new Error('Transaction returned no result.');
		return enrollmentSnapshot(result);
	};
