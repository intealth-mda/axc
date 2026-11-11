import { type CourseRepository, type EnrollmentRequestEntityReference, type EnrollmentRequestRepository, EnrollmentValidationError, InvalidStatusTransitionError, isEnrollmentStatus } from '@axc/domain';
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
	readonly reason: string | null;
}

export interface EnrollmentRequestFilter {
	status?: string | undefined;
	courseId?: string | undefined;
	learnerEmail?: string | undefined;
}

const invalid = (field: string, message: string) => new ServiceError('INVALID_REQUEST', 'The request could not be completed.', [{ field, message }]);

const record = (body: unknown): Record<string, unknown> => {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) throw invalid('body', 'body must be a JSON object.');
	return body as Record<string, unknown>;
};

const str = (body: Record<string, unknown>, field: string): string => {
	const v = body[field];
	if (typeof v !== 'string') throw invalid(field, `${field} is required and must be a string.`);
	return v;
};

const mapDomainError = (e: unknown): never => {
	if (e instanceof EnrollmentValidationError) throw invalid(e.field, e.message);
	if (e instanceof InvalidStatusTransitionError) throw new ServiceError('INVALID_STATUS_TRANSITION', e.message);
	throw e;
};

const notFound = (id: string) => new ServiceError('ENROLLMENT_REQUEST_NOT_FOUND', `Enrollment request ${id} was not found.`);

export const createEnrollmentRequestService = (courses: CourseRepository, requests: EnrollmentRequestRepository) => {
	const uow = new InMemoryUnitOfWork(requests);
	return {
		async create(body: unknown): Promise<EnrollmentRequestEntityReference> {
			const b = record(body);
			const command: CreateEnrollmentRequestCommand = { courseId: str(b, 'courseId'), learnerEmail: str(b, 'learnerEmail'), justification: str(b, 'justification') };
			const course = await courses.getById(command.courseId);
			if (!course) throw new ServiceError('COURSE_NOT_FOUND', `Course ${command.courseId} was not found.`);
			if (!course.isActive) throw new ServiceError('COURSE_NOT_ACTIVE', `Course ${command.courseId} is not active.`);
			let created: EnrollmentRequestEntityReference | undefined;
			await uow
				.withScopedTransaction(async (repo) => {
					const request = repo.getNewInstance(crypto.randomUUID(), command, new Date().toISOString());
					const dup = (await repo.getAll()).some((r) => r.isActive && r.props.courseId === command.courseId && r.props.learnerEmail.toLowerCase() === command.learnerEmail.toLowerCase());
					if (dup) throw new ServiceError('DUPLICATE_ACTIVE_REQUEST', 'Learner already has a pending or approved request for this course.');
					created = (await repo.save(request)).toReference();
				})
				.catch(mapDomainError);
			return created as EnrollmentRequestEntityReference;
		},

		async get(id: string): Promise<EnrollmentRequestEntityReference> {
			const r = await requests.getById(id);
			if (!r) throw notFound(id);
			return r.toReference();
		},

		async list(filter: EnrollmentRequestFilter): Promise<{ items: EnrollmentRequestEntityReference[] }> {
			const { status, courseId, learnerEmail } = filter;
			if (status !== undefined && !isEnrollmentStatus(status)) throw invalid('status', 'status must be one of pending, approved, rejected, cancelled.');
			const items = (await requests.getAll())
				.map((r) => r.toReference())
				.filter((r) => (status === undefined || r.status === status) && (courseId === undefined || r.courseId === courseId) && (learnerEmail === undefined || r.learnerEmail.toLowerCase() === learnerEmail.toLowerCase()));
			return { items };
		},

		async changeStatus(id: string, body: unknown): Promise<EnrollmentRequestEntityReference> {
			const b = record(body);
			const reason = b['reason'] ?? null;
			if (reason !== null && typeof reason !== 'string') throw invalid('reason', 'reason must be a string.');
			const command: ChangeEnrollmentStatusCommand = { status: str(b, 'status'), changedBy: str(b, 'changedBy'), reason };
			const { status } = command;
			if (!isEnrollmentStatus(status)) throw invalid('status', 'status must be one of pending, approved, rejected, cancelled.');
			let saved: EnrollmentRequestEntityReference | undefined;
			await uow
				.withScopedTransaction(async (repo) => {
					const r = await repo.getById(id);
					if (!r) throw notFound(id);
					r.changeStatus(status, command.changedBy, command.reason, new Date().toISOString());
					saved = (await repo.save(r)).toReference();
				})
				.catch(mapDomainError);
			return saved as EnrollmentRequestEntityReference;
		},
	};
};
