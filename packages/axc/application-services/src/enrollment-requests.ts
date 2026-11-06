import { randomUUID } from 'node:crypto';
import {
	type CourseRepository,
	type EnrollmentRequest,
	type EnrollmentRequestEntityReference,
	type EnrollmentRequestRepository,
	type EnrollmentStatus,
	EnrollmentValidationError,
	InvalidStatusTransitionError,
	isEnrollmentStatus,
	Justification,
	LearnerEmail,
} from '@axc/domain';
import { InMemoryUnitOfWork } from '@axc/persistence';
import { ServiceError } from './service-error.ts';

export interface CreateEnrollmentRequestCommand {
	readonly courseId: string;
	readonly learnerEmail: string;
	readonly justification: string;
}

export interface ChangeEnrollmentStatusCommand {
	readonly status: EnrollmentStatus;
	readonly changedBy: string;
	readonly reason: string | undefined;
}

export interface EnrollmentRequestFilter {
	status?: string | undefined;
	courseId?: string | undefined;
	learnerEmail?: string | undefined;
}

const invalid = (field: string, message: string) => new ServiceError('INVALID_REQUEST', 'The request could not be completed.', [{ field, message }]);

const asRecord = (body: unknown): Record<string, unknown> => {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) throw invalid('body', 'body must be a JSON object.');
	return body as Record<string, unknown>;
};

const readString = (body: Record<string, unknown>, field: string): string => {
	const value = body[field];
	if (typeof value !== 'string' || value.trim() === '') throw invalid(field, `${field} is required and must be a string.`);
	return value;
};

const parseCreate = (raw: unknown): CreateEnrollmentRequestCommand => {
	const body = asRecord(raw);
	return { courseId: readString(body, 'courseId'), learnerEmail: readString(body, 'learnerEmail'), justification: readString(body, 'justification') };
};

const parseChangeStatus = (raw: unknown): ChangeEnrollmentStatusCommand => {
	const body = asRecord(raw);
	const status = readString(body, 'status');
	if (!isEnrollmentStatus(status)) throw invalid('status', 'status must be pending, approved, rejected or cancelled.');
	const { reason } = body;
	if (reason !== undefined && reason !== null && typeof reason !== 'string') throw invalid('reason', 'reason must be a string.');
	return { status, changedBy: readString(body, 'changedBy'), reason: reason ?? undefined };
};

const mapDomainErrors = async <T>(work: () => Promise<T>): Promise<T> => {
	try {
		return await work();
	} catch (error) {
		if (error instanceof EnrollmentValidationError) throw invalid(error.field, error.message);
		if (error instanceof InvalidStatusTransitionError) throw new ServiceError('INVALID_STATUS_TRANSITION', error.message);
		throw error;
	}
};

const notFound = (id: string) => new ServiceError('ENROLLMENT_REQUEST_NOT_FOUND', `Enrollment request ${id} was not found.`);

export const buildEnrollmentRequestService = (courses: CourseRepository, requests: EnrollmentRequestRepository) => {
	const uow = new InMemoryUnitOfWork(requests);
	return {
		create: (raw: unknown): Promise<EnrollmentRequestEntityReference> =>
			mapDomainErrors(async () => {
				const command = parseCreate(raw);
				const learnerEmail = new LearnerEmail(command.learnerEmail);
				const justification = new Justification(command.justification);
				const course = await courses.getById(command.courseId);
				if (!course) throw new ServiceError('COURSE_NOT_FOUND', `Course ${command.courseId} was not found.`, [{ field: 'courseId', message: 'course does not exist.' }]);
				if (!course.isActive) throw new ServiceError('COURSE_NOT_ACTIVE', `Course ${command.courseId} is not active.`, [{ field: 'courseId', message: `course status is ${course.props.status}.` }]);
				let saved!: EnrollmentRequest;
				await uow.withScopedTransaction(async (repo) => {
					const all = await repo.getAll();
					if (all.some((r) => r.isActive && r.props.courseId === command.courseId && r.props.learnerEmail === learnerEmail.value)) {
						throw new ServiceError('DUPLICATE_ACTIVE_REQUEST', 'The learner already has a pending or approved request for this course.');
					}
					saved = await repo.save(await repo.getNewInstance(randomUUID(), { courseId: command.courseId, learnerEmail, justification }, new Date().toISOString()));
				});
				return saved.props;
			}),

		async getById(id: string): Promise<EnrollmentRequestEntityReference> {
			const request = await requests.getById(id);
			if (!request) throw notFound(id);
			return request.props;
		},

		async list(filter: EnrollmentRequestFilter): Promise<{ items: EnrollmentRequestEntityReference[] }> {
			const { status, courseId, learnerEmail } = filter;
			if (status !== undefined && !isEnrollmentStatus(status)) throw invalid('status', 'status must be pending, approved, rejected or cancelled.');
			const email = learnerEmail?.toLowerCase();
			const items = (await requests.getAll())
				.map((r) => r.props)
				.filter((r) => (status === undefined || r.status === status) && (courseId === undefined || r.courseId === courseId) && (email === undefined || r.learnerEmail === email));
			return { items };
		},

		changeStatus: (id: string, raw: unknown): Promise<EnrollmentRequestEntityReference> =>
			mapDomainErrors(async () => {
				const command = parseChangeStatus(raw);
				let saved!: EnrollmentRequest;
				await uow.withScopedTransaction(async (repo) => {
					const request = await repo.getById(id);
					if (!request) throw notFound(id);
					request.changeStatus(command.status, command.changedBy, command.reason, new Date().toISOString());
					saved = await repo.save(request);
				});
				return saved.props;
			}),
	};
};
