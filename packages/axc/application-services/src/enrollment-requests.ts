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
import { invalid, ServiceError } from './service-error.ts';

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
export interface EnrollmentRequestListQuery {
	status?: string | undefined;
	courseId?: string | undefined;
	learnerEmail?: string | undefined;
}

type Body = Record<string, unknown>;
const asBody = (body: unknown): Body => (typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Body) : {});
const str = (b: Body, field: string, required = true): string | null => {
	const v = b[field];
	if (typeof v === 'string' && (!required || v.trim() !== '')) return v;
	if (!required && (v === undefined || v === null)) return null;
	throw invalid([{ field, message: `${field} must be a${required ? ' non-empty' : ''} string.` }]);
};
const domainErrors = (e: unknown): never => {
	if (e instanceof EnrollmentValidationError) throw invalid([{ field: e.field, message: e.message }]);
	if (e instanceof InvalidStatusTransitionError) throw new ServiceError('INVALID_STATUS_TRANSITION', e.message);
	throw e;
};
const notFound = (id: string) => new ServiceError('ENROLLMENT_REQUEST_NOT_FOUND', `Enrollment request ${id} was not found.`);

export const parseCreate = (body: unknown): CreateEnrollmentRequestCommand => {
	const b = asBody(body);
	return { courseId: str(b, 'courseId') as string, learnerEmail: str(b, 'learnerEmail') as string, justification: str(b, 'justification') as string };
};
export const parseChangeStatus = (body: unknown): ChangeEnrollmentStatusCommand => {
	const b = asBody(body);
	return { status: str(b, 'status') as string, changedBy: str(b, 'changedBy') as string, reason: str(b, 'reason', false) };
};

export const enrollmentRequestServices = (repo: EnrollmentRequestRepository, courses: CourseRepository) => {
	const uow = new InMemoryUnitOfWork(repo);
	return {
		async create(cmd: CreateEnrollmentRequestCommand): Promise<EnrollmentRequestEntityReference> {
			let learnerEmail: LearnerEmail;
			let justification: Justification;
			try {
				learnerEmail = new LearnerEmail(cmd.learnerEmail);
				justification = new Justification(cmd.justification);
			} catch (e) {
				return domainErrors(e);
			}
			const course = await courses.getById(cmd.courseId);
			if (!course) throw new ServiceError('COURSE_NOT_FOUND', `Course ${cmd.courseId} was not found.`);
			if (!course.isActive) throw new ServiceError('COURSE_NOT_ACTIVE', `Course ${cmd.courseId} is not active.`);
			let saved: EnrollmentRequestEntityReference | undefined;
			await uow.withScopedTransaction(async (r) => {
				const existing = await r.find({ courseId: cmd.courseId, learnerEmail: learnerEmail.value });
				if (existing.some((e) => e.isActive)) throw new ServiceError('DUPLICATE_ACTIVE_REQUEST', 'Learner already has a pending or approved request for this course.');
				saved = (await r.save(r.getNewInstance(randomUUID(), { courseId: cmd.courseId, learnerEmail, justification }, new Date().toISOString()))).props;
			});
			return saved as EnrollmentRequestEntityReference;
		},
		async get(id: string): Promise<EnrollmentRequestEntityReference> {
			const item = await repo.getById(id);
			if (!item) throw notFound(id);
			return item.props;
		},
		async list(query: EnrollmentRequestListQuery): Promise<{ items: EnrollmentRequestEntityReference[] }> {
			const { status, courseId, learnerEmail } = query;
			if (status !== undefined && !isEnrollmentStatus(status)) throw invalid([{ field: 'status', message: 'status must be one of pending, approved, rejected, cancelled.' }]);
			return { items: (await repo.find({ status, courseId, learnerEmail })).map((e) => e.props) };
		},
		async changeStatus(id: string, cmd: ChangeEnrollmentStatusCommand): Promise<EnrollmentRequestEntityReference> {
			const { status } = cmd;
			if (!isEnrollmentStatus(status)) throw invalid([{ field: 'status', message: 'status must be one of pending, approved, rejected, cancelled.' }]);
			let saved: EnrollmentRequestEntityReference | undefined;
			await uow.withScopedTransaction(async (r) => {
				const item = await r.getById(id);
				if (!item) throw notFound(id);
				try {
					item.changeStatus(status, cmd.changedBy, cmd.reason, new Date().toISOString());
				} catch (e) {
					domainErrors(e);
				}
				saved = (await r.save(item)).props;
			});
			return saved as EnrollmentRequestEntityReference;
		},
	};
};
