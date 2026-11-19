import { randomUUID } from 'node:crypto';
import {
	type CourseRepository,
	type EnrollmentRequestEntityReference,
	type EnrollmentRequestRepository,
	InvalidEnrollmentValueError,
	InvalidStatusTransitionError,
	isEnrollmentStatus,
	Justification,
	LearnerEmail,
} from '@axc/domain';
import { InMemoryUnitOfWork } from '@axc/persistence';
import { ServiceError } from './service-error.ts';

export interface EnrollmentRequestFilter {
	status?: string | undefined;
	courseId?: string | undefined;
	learnerEmail?: string | undefined;
}

const str = (body: unknown, field: string, required = true): string | undefined => {
	const v = typeof body === 'object' && body !== null ? (body as Record<string, unknown>)[field] : undefined;
	if (typeof v === 'string' && (!required || v.trim())) return v;
	if (v === undefined && !required) return undefined;
	throw new ServiceError('INVALID_REQUEST', 'The request could not be completed.', [{ field, message: `${field} must be a non-empty string.` }]);
};

const domainErrors = (e: unknown): never => {
	if (e instanceof InvalidEnrollmentValueError) throw new ServiceError('INVALID_REQUEST', 'The request could not be completed.', [{ field: e.field, message: e.message }]);
	if (e instanceof InvalidStatusTransitionError) throw new ServiceError('INVALID_STATUS_TRANSITION', e.message);
	throw e;
};

export const enrollmentRequestService = (courses: CourseRepository, repo: EnrollmentRequestRepository) => {
	const uow = new InMemoryUnitOfWork(repo);
	const notFound = () => new ServiceError('ENROLLMENT_REQUEST_NOT_FOUND', 'Enrollment request not found.');
	return {
		async create(body: unknown): Promise<EnrollmentRequestEntityReference> {
			const courseId = str(body, 'courseId') ?? '';
			let email: LearnerEmail;
			let justification: Justification;
			try {
				email = new LearnerEmail(str(body, 'learnerEmail', false) ?? '');
				justification = new Justification(str(body, 'justification', false) ?? '');
			} catch (e) {
				return domainErrors(e);
			}
			const course = await courses.getById(courseId);
			if (!course) throw new ServiceError('COURSE_NOT_FOUND', 'Course not found.');
			if (!course.isActive) throw new ServiceError('COURSE_NOT_ACTIVE', 'Course is not active.');
			let saved: EnrollmentRequestEntityReference | undefined;
			await uow.withScopedTransaction(async (r) => {
				if ((await r.getAll()).some((x) => x.isActive && x.props.courseId === courseId && x.props.learnerEmail === email.value))
					throw new ServiceError('DUPLICATE_ACTIVE_REQUEST', 'Learner already has an active request for this course.');
				saved = (await r.save(r.getNewInstance(randomUUID(), courseId, email, justification, new Date().toISOString()))).toJSON();
			});
			return saved as EnrollmentRequestEntityReference;
		},
		async get(id: string): Promise<EnrollmentRequestEntityReference> {
			const r = await repo.getById(id);
			if (!r) throw notFound();
			return r.toJSON();
		},
		async list(filter: EnrollmentRequestFilter): Promise<EnrollmentRequestEntityReference[]> {
			const { status, courseId, learnerEmail } = filter;
			if (status !== undefined && !isEnrollmentStatus(status))
				throw new ServiceError('INVALID_REQUEST', 'The request could not be completed.', [{ field: 'status', message: 'status must be pending, approved, rejected or cancelled.' }]);
			return (await repo.getAll())
				.map((r) => r.toJSON())
				.filter((r) => (status === undefined || r.status === status) && (courseId === undefined || r.courseId === courseId) && (learnerEmail === undefined || r.learnerEmail === learnerEmail.toLowerCase()));
		},
		async changeStatus(id: string, body: unknown): Promise<EnrollmentRequestEntityReference> {
			const status = str(body, 'status') ?? '';
			if (!isEnrollmentStatus(status)) throw new ServiceError('INVALID_REQUEST', 'The request could not be completed.', [{ field: 'status', message: 'status must be pending, approved, rejected or cancelled.' }]);
			const changedBy = str(body, 'changedBy') ?? '';
			const reason = str(body, 'reason', false) ?? null;
			let saved: EnrollmentRequestEntityReference | undefined;
			await uow.withScopedTransaction(async (r) => {
				const req = await r.getById(id);
				if (!req) throw notFound();
				try {
					req.changeStatus(status, changedBy, reason, new Date().toISOString());
				} catch (e) {
					domainErrors(e);
				}
				saved = (await r.save(req)).toJSON();
			});
			return saved as EnrollmentRequestEntityReference;
		},
	};
};
