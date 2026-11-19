import { randomUUID } from 'node:crypto';
import { type CourseRepository, type EnrollmentRequestEntityReference, type EnrollmentRequestRepository, InvalidEnrollmentValueError, InvalidStatusTransitionError, isActiveEnrollmentStatus, isEnrollmentStatus } from '@axc/domain';
import { InMemoryUnitOfWork } from '@axc/persistence';
import { ServiceError } from './service-error.ts';

export interface CreateEnrollmentRequestCommand {
	readonly courseId: string;
	readonly learnerEmail: string;
	readonly justification: string;
}
export interface ChangeEnrollmentStatusCommand {
	readonly status: string;
	readonly changedBy: string;
	readonly reason?: string | undefined;
}
export interface EnrollmentRequestFilter {
	status?: string | undefined;
	courseId?: string | undefined;
	learnerEmail?: string | undefined;
}

const invalid = (field: string, message: string) => new ServiceError('INVALID_REQUEST', 'The request could not be completed.', [{ field, message }]);
const obj = (body: unknown): Record<string, unknown> => {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) throw invalid('body', 'body must be a JSON object.');
	return body as Record<string, unknown>;
};
const str = (b: Record<string, unknown>, field: string, optional = false): string | undefined => {
	const v = b[field];
	if (v === undefined && optional) return undefined;
	if (typeof v !== 'string') throw invalid(field, `${field} must be a string.`);
	return v;
};
const mapDomain = (e: unknown): never => {
	if (e instanceof InvalidEnrollmentValueError) throw invalid(e.field, e.message);
	if (e instanceof InvalidStatusTransitionError) throw new ServiceError('INVALID_STATUS_TRANSITION', e.message);
	throw e;
};
const notFound = (id: string) => new ServiceError('ENROLLMENT_REQUEST_NOT_FOUND', `Enrollment request ${id} not found.`);

export const enrollmentRequestService = (courses: CourseRepository, repo: EnrollmentRequestRepository) => {
	const uow = new InMemoryUnitOfWork(repo);
	return {
		toCreateCommand(body: unknown): CreateEnrollmentRequestCommand {
			const b = obj(body);
			return { courseId: str(b, 'courseId') ?? '', learnerEmail: str(b, 'learnerEmail') ?? '', justification: str(b, 'justification') ?? '' };
		},
		toStatusCommand(body: unknown): ChangeEnrollmentStatusCommand {
			const b = obj(body);
			return { status: str(b, 'status') ?? '', changedBy: str(b, 'changedBy') ?? '', reason: str(b, 'reason', true) };
		},
		async create(cmd: CreateEnrollmentRequestCommand): Promise<EnrollmentRequestEntityReference> {
			let saved: EnrollmentRequestEntityReference | undefined;
			await uow.withScopedTransaction(async (r) => {
				const course = await courses.getById(cmd.courseId);
				if (!course) throw new ServiceError('COURSE_NOT_FOUND', `Course ${cmd.courseId} not found.`);
				if (!course.isActive) throw new ServiceError('COURSE_NOT_ACTIVE', `Course ${cmd.courseId} is not active.`);
				let req: ReturnType<typeof r.getNewInstance>;
				try {
					req = r.getNewInstance(`enroll-${randomUUID()}`, cmd, new Date().toISOString());
				} catch (e) {
					return mapDomain(e);
				}
				const email = req.learnerEmail.toLowerCase();
				if ((await r.getAll()).some((x) => x.courseId === cmd.courseId && x.learnerEmail.toLowerCase() === email && isActiveEnrollmentStatus(x.status))) {
					throw new ServiceError('DUPLICATE_ACTIVE_REQUEST', 'Learner already has a pending or approved request for this course.');
				}
				saved = (await r.save(req)).toReference();
			});
			return saved as EnrollmentRequestEntityReference;
		},
		async getById(id: string): Promise<EnrollmentRequestEntityReference> {
			const r = await repo.getById(id);
			if (!r) throw notFound(id);
			return r.toReference();
		},
		async list(filter: EnrollmentRequestFilter): Promise<EnrollmentRequestEntityReference[]> {
			const { status, courseId, learnerEmail } = filter;
			if (status !== undefined && !isEnrollmentStatus(status)) throw invalid('status', 'status must be one of pending, approved, rejected, cancelled.');
			return (await repo.getAll())
				.map((r) => r.toReference())
				.filter((r) => (!status || r.status === status) && (!courseId || r.courseId === courseId) && (!learnerEmail || r.learnerEmail.toLowerCase() === learnerEmail.toLowerCase()));
		},
		async changeStatus(id: string, cmd: ChangeEnrollmentStatusCommand): Promise<EnrollmentRequestEntityReference> {
			const { status } = cmd;
			if (!isEnrollmentStatus(status)) throw invalid('status', 'status must be one of pending, approved, rejected, cancelled.');
			let saved: EnrollmentRequestEntityReference | undefined;
			await uow.withScopedTransaction(async (r) => {
				const req = await r.getById(id);
				if (!req) throw notFound(id);
				try {
					req.changeStatus(status, cmd.changedBy, cmd.reason, new Date().toISOString());
				} catch (e) {
					mapDomain(e);
				}
				saved = (await r.save(req)).toReference();
			});
			return saved as EnrollmentRequestEntityReference;
		},
	};
};
