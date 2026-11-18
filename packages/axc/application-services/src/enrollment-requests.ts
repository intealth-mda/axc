import { randomUUID } from 'node:crypto';
import { type CourseRepository, type EnrollmentRequest, type EnrollmentRequestEntityReference, type EnrollmentRequestRepository, InvalidEnrollmentValueError, InvalidStatusTransitionError, isEnrollmentStatus } from '@axc/domain';
import { InMemoryUnitOfWork } from '@axc/persistence';
import { ServiceError } from './service-error.ts';

interface CreateEnrollmentRequestCommand {
	readonly courseId: string;
	readonly learnerEmail: string;
	readonly justification: string;
}

interface ChangeEnrollmentStatusCommand {
	readonly status: string;
	readonly changedBy: string;
	readonly reason?: string | undefined;
}

export interface EnrollmentRequestListQuery {
	status?: string | undefined;
	courseId?: string | undefined;
	learnerEmail?: string | undefined;
}

const invalid = (field: string, message: string) => new ServiceError('INVALID_REQUEST', 'The request could not be completed.', [{ field, message }]);

const str = (body: unknown, field: string, optional = false): string | undefined => {
	const v = typeof body === 'object' && body !== null ? (body as Record<string, unknown>)[field] : undefined;
	if (typeof v === 'string' || (optional && (v === undefined || v === null))) return v ?? undefined;
	throw invalid(field, `${field} must be a string.`);
};

const domainCall = <T>(fn: () => T): T => {
	try {
		return fn();
	} catch (e) {
		if (e instanceof InvalidEnrollmentValueError) throw invalid(e.field, e.message);
		if (e instanceof InvalidStatusTransitionError) throw new ServiceError('INVALID_STATUS_TRANSITION', e.message);
		throw e;
	}
};

export const buildEnrollmentRequestService = (courses: CourseRepository, requests: EnrollmentRequestRepository) => {
	const uow = new InMemoryUnitOfWork<EnrollmentRequest, EnrollmentRequestRepository>(requests);
	const notFound = (id: string) => new ServiceError('ENROLLMENT_REQUEST_NOT_FOUND', `Enrollment request ${id} was not found.`);
	return {
		async create(body: unknown): Promise<EnrollmentRequestEntityReference> {
			const command: CreateEnrollmentRequestCommand = { courseId: str(body, 'courseId') ?? '', learnerEmail: str(body, 'learnerEmail') ?? '', justification: str(body, 'justification') ?? '' };
			const draft = domainCall(() => requests.getNewInstance(`enroll-${randomUUID()}`, command, new Date().toISOString()));
			const course = await courses.getById(command.courseId);
			if (!course) throw new ServiceError('COURSE_NOT_FOUND', `Course ${command.courseId} was not found.`);
			if (!course.isActive) throw new ServiceError('COURSE_NOT_ACTIVE', `Course ${command.courseId} is not active.`);
			await uow.withScopedTransaction(async (repo) => {
				const existing = await repo.find({ courseId: command.courseId, learnerEmail: command.learnerEmail });
				if (existing.some((r) => r.isActive)) throw new ServiceError('DUPLICATE_ACTIVE_REQUEST', 'The learner already has a pending or approved request for this course.');
				await repo.save(draft);
			});
			return draft.toReference();
		},
		async get(id: string): Promise<EnrollmentRequestEntityReference> {
			const found = await requests.getById(id);
			if (!found) throw notFound(id);
			return found.toReference();
		},
		async list(query: EnrollmentRequestListQuery): Promise<EnrollmentRequestEntityReference[]> {
			const { status, courseId, learnerEmail } = query;
			if (status !== undefined && !isEnrollmentStatus(status)) throw invalid('status', 'status must be one of pending, approved, rejected, cancelled.');
			return (await requests.find({ status, courseId, learnerEmail })).map((r) => r.toReference());
		},
		async changeStatus(id: string, body: unknown): Promise<EnrollmentRequestEntityReference> {
			const command: ChangeEnrollmentStatusCommand = { status: str(body, 'status') ?? '', changedBy: str(body, 'changedBy') ?? '', reason: str(body, 'reason', true) };
			const { status } = command;
			if (!isEnrollmentStatus(status)) throw invalid('status', 'status must be one of pending, approved, rejected, cancelled.');
			let saved: EnrollmentRequest | undefined;
			await uow.withScopedTransaction(async (repo) => {
				const found = await repo.getById(id);
				if (!found) throw notFound(id);
				domainCall(() => found.changeStatus(status, command.changedBy, command.reason, new Date().toISOString()));
				saved = await repo.save(found);
			});
			return (saved as EnrollmentRequest).toReference();
		},
	};
};
