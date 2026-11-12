import { randomUUID } from 'node:crypto';
import {
	ActiveStatuses,
	type CourseRepository,
	type EnrollmentRequestEntityReference,
	type EnrollmentRequestRepository,
	type EnrollmentStatus,
	InvalidEnrollmentFieldError,
	InvalidStatusTransitionError,
	isEnrollmentStatus,
} from '@axc/domain';
import { InMemoryUnitOfWork } from '@axc/persistence';
import { ServiceError } from './service-error.ts';

interface CreateEnrollmentRequestCommand {
	readonly courseId: string;
	readonly learnerEmail: string;
	readonly justification: string;
}

interface ChangeEnrollmentStatusCommand {
	readonly status: EnrollmentStatus;
	readonly changedBy: string;
	readonly reason?: string | undefined;
}

export interface EnrollmentRequestListQuery {
	status?: string | undefined;
	courseId?: string | undefined;
	learnerEmail?: string | undefined;
}

const invalid = (field: string, message: string) => new ServiceError('INVALID_REQUEST', 'The request could not be completed.', [{ field, message }]);

const asRecord = (body: unknown): Record<string, unknown> => {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) throw invalid('body', 'body must be a JSON object.');
	return body as Record<string, unknown>;
};

const str = (rec: Record<string, unknown>, field: string): string => {
	const v = rec[field];
	if (typeof v !== 'string') throw invalid(field, `${field} must be a string.`);
	return v;
};

const toCreateCommand = (body: unknown): CreateEnrollmentRequestCommand => {
	const rec = asRecord(body);
	return { courseId: str(rec, 'courseId'), learnerEmail: str(rec, 'learnerEmail'), justification: str(rec, 'justification') };
};

const toChangeCommand = (body: unknown): ChangeEnrollmentStatusCommand => {
	const rec = asRecord(body);
	const status = str(rec, 'status');
	if (!isEnrollmentStatus(status)) throw invalid('status', 'status must be one of pending, approved, rejected, cancelled.');
	const reason = rec['reason'] ?? undefined;
	if (reason !== undefined && typeof reason !== 'string') throw invalid('reason', 'reason must be a string.');
	return { status, changedBy: str(rec, 'changedBy'), reason };
};

const mapDomainError = (e: unknown): never => {
	if (e instanceof InvalidEnrollmentFieldError) throw invalid(e.field, e.message);
	if (e instanceof InvalidStatusTransitionError) throw new ServiceError('INVALID_STATUS_TRANSITION', e.message);
	throw e;
};

const notFound = (id: string) => new ServiceError('ENROLLMENT_REQUEST_NOT_FOUND', `Enrollment request ${id} was not found.`);

export function enrollmentRequestService(courses: CourseRepository, repo: EnrollmentRequestRepository) {
	const uow = new InMemoryUnitOfWork(repo);
	return {
		async create(body: unknown): Promise<EnrollmentRequestEntityReference> {
			const cmd = toCreateCommand(body);
			const course = await courses.getById(cmd.courseId);
			if (!course) throw new ServiceError('COURSE_NOT_FOUND', `Course ${cmd.courseId} was not found.`);
			if (!course.isActive) throw new ServiceError('COURSE_NOT_ACTIVE', `Course ${cmd.courseId} is not active.`);
			let saved: EnrollmentRequestEntityReference | undefined;
			await uow.withScopedTransaction(async (r) => {
				const created = (() => {
					try {
						return r.getNewInstance(randomUUID(), cmd, new Date().toISOString());
					} catch (e) {
						return mapDomainError(e);
					}
				})();
				const existing = await r.find({ courseId: cmd.courseId, learnerEmail: created.props.learnerEmail });
				if (existing.some((x) => ActiveStatuses.includes(x.props.status))) {
					throw new ServiceError('DUPLICATE_ACTIVE_REQUEST', 'Learner already has a pending or approved request for this course.');
				}
				saved = (await r.save(created)).toReference();
			});
			return saved as EnrollmentRequestEntityReference;
		},

		async getById(id: string): Promise<EnrollmentRequestEntityReference> {
			const found = await repo.getById(id);
			if (!found) throw notFound(id);
			return found.toReference();
		},

		async list(query: EnrollmentRequestListQuery): Promise<{ items: EnrollmentRequestEntityReference[] }> {
			const { status, courseId, learnerEmail } = query;
			if (status !== undefined && !isEnrollmentStatus(status)) throw invalid('status', 'status must be one of pending, approved, rejected, cancelled.');
			const items = await repo.find({ status, courseId, learnerEmail });
			return { items: items.map((x) => x.toReference()) };
		},

		async changeStatus(id: string, body: unknown): Promise<EnrollmentRequestEntityReference> {
			const cmd = toChangeCommand(body);
			let saved: EnrollmentRequestEntityReference | undefined;
			await uow.withScopedTransaction(async (r) => {
				const found = await r.getById(id);
				if (!found) throw notFound(id);
				try {
					found.changeStatus(cmd.status, cmd.changedBy, cmd.reason, new Date().toISOString());
				} catch (e) {
					mapDomainError(e);
				}
				saved = (await r.save(found)).toReference();
			});
			return saved as EnrollmentRequestEntityReference;
		},
	};
}
