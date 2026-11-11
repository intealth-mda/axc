import { randomUUID } from 'node:crypto';
import { type CourseRepository, type EnrollmentRequestEntityReference, type EnrollmentRequestRepository, InvalidEnrollmentValueError, InvalidStatusTransitionError, isEnrollmentStatus } from '@axc/domain';
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

const str = (rec: Record<string, unknown>, field: string, optional = false): string | undefined => {
	const v = rec[field];
	if (v === undefined && optional) return undefined;
	if (typeof v !== 'string') throw invalid(field, `${field} must be a string.`);
	return v;
};

const statusOf = (v: string) => {
	if (!isEnrollmentStatus(v)) throw invalid('status', 'status must be one of pending, approved, rejected, cancelled.');
	return v;
};

const mapDomain = (e: unknown): never => {
	if (e instanceof InvalidEnrollmentValueError) throw invalid(e.field, e.message);
	if (e instanceof InvalidStatusTransitionError) throw new ServiceError('INVALID_STATUS_TRANSITION', e.message);
	throw e;
};

const notFound = (id: string) => new ServiceError('ENROLLMENT_REQUEST_NOT_FOUND', `Enrollment request ${id} was not found.`);

export const enrollmentRequestService = (courses: CourseRepository, requests: EnrollmentRequestRepository) => {
	const uow = new InMemoryUnitOfWork(requests);
	return {
		toCreateCommand(body: unknown): CreateEnrollmentRequestCommand {
			const rec = asRecord(body);
			return { courseId: str(rec, 'courseId') ?? '', learnerEmail: str(rec, 'learnerEmail') ?? '', justification: str(rec, 'justification') ?? '' };
		},

		toChangeStatusCommand(body: unknown): ChangeEnrollmentStatusCommand {
			const rec = asRecord(body);
			return { status: str(rec, 'status') ?? '', changedBy: str(rec, 'changedBy') ?? '', reason: str(rec, 'reason', true) };
		},

		async create(body: unknown): Promise<EnrollmentRequestEntityReference> {
			const cmd = this.toCreateCommand(body);
			let saved: EnrollmentRequestEntityReference | undefined;
			await uow.withScopedTransaction(async (repo) => {
				const course = await courses.getById(cmd.courseId);
				if (course === undefined) throw new ServiceError('COURSE_NOT_FOUND', `Course ${cmd.courseId} was not found.`, [{ field: 'courseId', message: 'courseId must reference an existing course.' }]);
				if (!course.isActive) throw new ServiceError('COURSE_NOT_ACTIVE', `Course ${cmd.courseId} is not active.`, [{ field: 'courseId', message: 'courseId must reference an active course.' }]);
				const request = (() => {
					try {
						return repo.getNewInstance(randomUUID(), cmd, new Date().toISOString());
					} catch (e) {
						return mapDomain(e);
					}
				})();
				const existing = await repo.find({ courseId: cmd.courseId, learnerEmail: cmd.learnerEmail });
				if (existing.some((r) => r.isActive)) throw new ServiceError('DUPLICATE_ACTIVE_REQUEST', 'The learner already has a pending or approved request for this course.');
				saved = (await repo.save(request)).props;
			});
			return saved as EnrollmentRequestEntityReference;
		},

		async getById(id: string): Promise<EnrollmentRequestEntityReference> {
			const found = await requests.getById(id);
			if (found === undefined) throw notFound(id);
			return found.props;
		},

		async list(query: EnrollmentRequestListQuery): Promise<{ items: EnrollmentRequestEntityReference[] }> {
			const { status, courseId, learnerEmail } = query;
			const items = await requests.find({ status: status === undefined ? undefined : statusOf(status), courseId, learnerEmail });
			return { items: items.map((r) => r.props) };
		},

		async changeStatus(id: string, body: unknown): Promise<EnrollmentRequestEntityReference> {
			const cmd = this.toChangeStatusCommand(body);
			const to = statusOf(cmd.status);
			let saved: EnrollmentRequestEntityReference | undefined;
			await uow.withScopedTransaction(async (repo) => {
				const request = await repo.getById(id);
				if (request === undefined) throw notFound(id);
				try {
					request.changeStatus(to, cmd.changedBy, cmd.reason, new Date().toISOString());
				} catch (e) {
					mapDomain(e);
				}
				saved = (await repo.save(request)).props;
			});
			return saved as EnrollmentRequestEntityReference;
		},
	};
};
