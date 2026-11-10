import { randomUUID } from 'node:crypto';
import {
	type CourseRepository,
	type EnrollmentRequestEntityReference,
	type EnrollmentRequestRepository,
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
	readonly status: string;
	readonly changedBy: string;
	readonly reason?: string | undefined;
}

export interface EnrollmentRequestQuery {
	status?: string | undefined;
	courseId?: string | undefined;
	learnerEmail?: string | undefined;
}

const invalid = (field: string, message: string) => new ServiceError('INVALID_REQUEST', 'The request could not be completed.', [{ field, message }]);

const field = (body: unknown, name: string, optional = false): string | undefined => {
	const v = typeof body === 'object' && body !== null ? (body as Record<string, unknown>)[name] : undefined;
	if (v === undefined && optional) return undefined;
	if (typeof v !== 'string' || (!optional && v.trim() === '')) throw invalid(name, `${name} must be a non-empty string.`);
	return v;
};

const toCreateCommand = (body: unknown): CreateEnrollmentRequestCommand => ({
	courseId: field(body, 'courseId') ?? '',
	learnerEmail: field(body, 'learnerEmail') ?? '',
	justification: field(body, 'justification') ?? '',
});

const toChangeCommand = (body: unknown): ChangeEnrollmentStatusCommand => ({
	status: field(body, 'status') ?? '',
	changedBy: field(body, 'changedBy') ?? '',
	reason: field(body, 'reason', true),
});

const translate = (e: unknown): never => {
	if (e instanceof EnrollmentValidationError) throw invalid(e.field, e.message);
	if (e instanceof InvalidStatusTransitionError) throw new ServiceError('INVALID_STATUS_TRANSITION', e.message);
	throw e;
};

const notFound = (id: string) => new ServiceError('ENROLLMENT_REQUEST_NOT_FOUND', `Enrollment request ${id} not found.`);

export const enrollmentRequestService = (repo: EnrollmentRequestRepository, courses: CourseRepository) => {
	const uow = new InMemoryUnitOfWork(repo);
	return {
		async create(body: unknown): Promise<EnrollmentRequestEntityReference> {
			const cmd = toCreateCommand(body);
			let input: { courseId: string; learnerEmail: LearnerEmail; justification: Justification } | undefined;
			try {
				input = { courseId: cmd.courseId, learnerEmail: new LearnerEmail(cmd.learnerEmail), justification: new Justification(cmd.justification) };
			} catch (e) {
				translate(e);
			}
			if (!input) throw invalid('body', 'invalid');
			const course = await courses.getById(cmd.courseId);
			if (!course) throw new ServiceError('COURSE_NOT_FOUND', `Course ${cmd.courseId} not found.`);
			if (!course.isActive) throw new ServiceError('COURSE_NOT_ACTIVE', `Course ${cmd.courseId} is not active.`);
			const created = input;
			let saved: EnrollmentRequestEntityReference | undefined;
			await uow.withScopedTransaction(async (r) => {
				const existing = await r.find({ courseId: created.courseId, learnerEmail: created.learnerEmail.value });
				if (existing.some((x) => x.isActive)) throw new ServiceError('DUPLICATE_ACTIVE_REQUEST', 'Learner already has a pending or approved request for this course.');
				saved = (await r.save(r.getNewInstance(randomUUID(), created, new Date().toISOString()))).props;
			});
			return saved as EnrollmentRequestEntityReference;
		},

		async get(id: string): Promise<EnrollmentRequestEntityReference> {
			const r = await repo.getById(id);
			if (!r) throw notFound(id);
			return r.props;
		},

		async list(query: EnrollmentRequestQuery): Promise<EnrollmentRequestEntityReference[]> {
			const { status, courseId, learnerEmail } = query;
			if (status !== undefined && !isEnrollmentStatus(status)) throw invalid('status', 'status must be one of pending, approved, rejected, cancelled.');
			return (await repo.find({ status, courseId, learnerEmail })).map((r) => r.props);
		},

		async changeStatus(id: string, body: unknown): Promise<EnrollmentRequestEntityReference> {
			const cmd = toChangeCommand(body);
			const { status } = cmd;
			if (!isEnrollmentStatus(status)) throw invalid('status', 'status must be one of pending, approved, rejected, cancelled.');
			let saved: EnrollmentRequestEntityReference | undefined;
			await uow.withScopedTransaction(async (r) => {
				const x = await r.getById(id);
				if (!x) throw notFound(id);
				try {
					x.changeStatus(status, cmd.changedBy, cmd.reason, new Date().toISOString());
				} catch (e) {
					translate(e);
				}
				saved = (await r.save(x)).props;
			});
			return saved as EnrollmentRequestEntityReference;
		},
	};
};
