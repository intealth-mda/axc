import { randomUUID } from 'node:crypto';
import type { Enrollment } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { ApplicationError } from '../../errors.ts';
export interface CreateEnrollmentRequestCommand {
	courseId: string;
	learnerEmail: string;
	justification: string;
}
export const create =
	(dataSources: DataSources): ((command: CreateEnrollmentRequestCommand) => Promise<Enrollment.EnrollmentRequestEntityReference>) =>
	async (command: CreateEnrollmentRequestCommand) => {
		const details: { field: string; message: string }[] = [];
		if (typeof command.courseId !== 'string' || !command.courseId.trim()) details.push({ field: 'courseId', message: 'courseId is required.' });
		if (typeof command.learnerEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(command.learnerEmail.trim())) details.push({ field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' });
		if (typeof command.justification !== 'string' || command.justification.trim().length < 20 || command.justification.trim().length > 500)
			details.push({ field: 'justification', message: 'justification must be between 20 and 500 characters.' });
		if (details.length) throw new ApplicationError('INVALID_REQUEST', details);
		const course = await dataSources.readonlyDataSource.Catalog.Course.CourseReadRepo.getById(command.courseId);
		if (!course) throw new ApplicationError('COURSE_NOT_FOUND');
		if (course.status !== 'active') throw new ApplicationError('COURSE_NOT_ACTIVE');
		const email = command.learnerEmail.trim().toLowerCase();
		const id = randomUUID();
		await dataSources.domainDataSource.Enrollment.EnrollmentRequest.EnrollmentRequestUnitOfWork.withScopedTransaction(async (repo) => {
			const existing = await dataSources.readonlyDataSource.Enrollment.EnrollmentRequest.EnrollmentRequestReadRepo.list({ courseId: command.courseId, learnerEmail: email });
			if (existing.some((x) => x.status === 'pending' || x.status === 'approved')) throw new ApplicationError('DUPLICATE_ACTIVE_REQUEST');
			const now = new Date().toISOString();
			const entity = await repo.getNewInstance({ id, courseId: command.courseId, learnerEmail: email, justification: command.justification, createdAt: now });
			await repo.save(entity);
		});
		const created = await dataSources.readonlyDataSource.Enrollment.EnrollmentRequest.EnrollmentRequestReadRepo.getById(id);
		if (!created) throw new Error('Creation failed');
		return created;
	};
