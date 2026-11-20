import { randomUUID } from 'node:crypto';
import { ActiveEnrollmentStatuses, type CourseRepository, type EnrollmentRequestEntityReference, type EnrollmentRequestRepository, EnrollmentValidationError, InvalidStatusTransitionError, isEnrollmentStatus } from '@axc/domain';
import { InMemoryUnitOfWork } from '@axc/persistence';
import { ServiceError } from './service-error.ts';

export interface EnrollmentRequestListQuery {
	status?: string | undefined;
	courseId?: string | undefined;
	learnerEmail?: string | undefined;
}
const invalid = (field: string, message: string) => new ServiceError('INVALID_REQUEST', 'The request could not be completed.', [{ field, message }]);
const str = (body: unknown, field: string, required = true): string | undefined => {
	const v = typeof body === 'object' && body !== null ? (body as Record<string, unknown>)[field] : undefined;
	if (v === undefined && !required) return undefined;
	if (typeof v !== 'string' || (required && !v.trim())) throw invalid(field, `${field} must be a non-empty string.`);
	return v;
};
const translate = (e: unknown): never => {
	if (e instanceof EnrollmentValidationError) throw invalid(e.field, e.message);
	if (e instanceof InvalidStatusTransitionError) throw new ServiceError('INVALID_STATUS_TRANSITION', e.message);
	throw e;
};
const notFound = (id: string) => new ServiceError('ENROLLMENT_REQUEST_NOT_FOUND', `Enrollment request ${id} was not found.`);

export const enrollmentRequestService = (repo: EnrollmentRequestRepository, courses: CourseRepository) => {
	const uow = new InMemoryUnitOfWork(repo);
	return {
		async create(body: unknown): Promise<EnrollmentRequestEntityReference> {
			const input = { courseId: str(body, 'courseId') ?? '', learnerEmail: str(body, 'learnerEmail') ?? '', justification: str(body, 'justification') ?? '' };
			let saved: EnrollmentRequestEntityReference | undefined;
			await uow
				.withScopedTransaction(async (r) => {
					const request = r.getNewInstance(randomUUID(), input, new Date().toISOString());
					const course = await courses.getById(input.courseId);
					if (!course) throw new ServiceError('COURSE_NOT_FOUND', `Course ${input.courseId} was not found.`);
					if (!course.isActive) throw new ServiceError('COURSE_NOT_ACTIVE', `Course ${input.courseId} is not active.`);
					const existing = await r.find({ courseId: input.courseId, learnerEmail: input.learnerEmail });
					if (existing.some((x) => ActiveEnrollmentStatuses.includes(x.props.status))) throw new ServiceError('DUPLICATE_ACTIVE_REQUEST', 'Learner already has a pending or approved request for this course.');
					saved = (await r.save(request)).toReference();
				})
				.catch(translate);
			return saved as EnrollmentRequestEntityReference;
		},
		async get(id: string): Promise<EnrollmentRequestEntityReference> {
			const r = await repo.getById(id);
			if (!r) throw notFound(id);
			return r.toReference();
		},
		async list(query: EnrollmentRequestListQuery): Promise<EnrollmentRequestEntityReference[]> {
			const { status, courseId, learnerEmail } = query;
			if (status !== undefined && !isEnrollmentStatus(status)) throw invalid('status', 'status must be one of pending, approved, rejected, cancelled.');
			return (await repo.find({ status, courseId, learnerEmail })).map((r) => r.toReference());
		},
		async changeStatus(id: string, body: unknown): Promise<EnrollmentRequestEntityReference> {
			const status = str(body, 'status') ?? '';
			if (!isEnrollmentStatus(status)) throw invalid('status', 'status must be one of pending, approved, rejected, cancelled.');
			const changedBy = str(body, 'changedBy') ?? '';
			const reason = str(body, 'reason', false);
			let saved: EnrollmentRequestEntityReference | undefined;
			await uow
				.withScopedTransaction(async (r) => {
					const request = await r.getById(id);
					if (!request) throw notFound(id);
					request.changeStatus(status, changedBy, reason, new Date().toISOString());
					saved = (await r.save(request)).toReference();
				})
				.catch(translate);
			return saved as EnrollmentRequestEntityReference;
		},
	};
};
