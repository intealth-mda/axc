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
import { type ErrorDetail, ServiceError } from './service-error.ts';

export interface EnrollmentRequestFilter {
	status?: string | undefined;
	courseId?: string | undefined;
	learnerEmail?: string | undefined;
}

const invalid = (details: ErrorDetail[]) => new ServiceError('INVALID_REQUEST', 'The request could not be completed.', details);

const asObject = (body: unknown): { [k: string]: unknown } => {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) throw invalid([{ field: 'body', message: 'body must be a JSON object.' }]);
	return body as { [k: string]: unknown };
};

const strings = <K extends string>(body: unknown, required: K[], optional: K[] = []): Record<K, string | undefined> => {
	const o = asObject(body);
	const out = {} as Record<K, string | undefined>;
	const errors: ErrorDetail[] = [];
	for (const k of [...required, ...optional]) {
		const v = o[k];
		if (typeof v === 'string') out[k] = v;
		else if (v !== undefined && v !== null) errors.push({ field: k, message: `${k} must be a string.` });
		else if (required.includes(k)) errors.push({ field: k, message: `${k} is required.` });
	}
	if (errors.length) throw invalid(errors);
	return out;
};

const mapDomainError = (e: unknown): never => {
	if (e instanceof InvalidEnrollmentValueError) throw invalid([{ field: e.field, message: e.message }]);
	if (e instanceof InvalidStatusTransitionError) throw new ServiceError('INVALID_STATUS_TRANSITION', e.message);
	throw e;
};

export function enrollmentRequestService(courses: CourseRepository, repo: EnrollmentRequestRepository) {
	const uow = new InMemoryUnitOfWork(repo);
	const notFound = () => new ServiceError('ENROLLMENT_REQUEST_NOT_FOUND', 'Enrollment request not found.');

	return {
		async create(body: unknown): Promise<EnrollmentRequestEntityReference> {
			const { courseId = '', learnerEmail = '', justification = '' } = strings(body, ['courseId', 'learnerEmail', 'justification']);
			const input = (() => {
				try {
					return { courseId, learnerEmail: new LearnerEmail(learnerEmail), justification: new Justification(justification) };
				} catch (e) {
					return mapDomainError(e);
				}
			})();
			const course = await courses.getById(courseId);
			if (!course) throw new ServiceError('COURSE_NOT_FOUND', `Course ${courseId} not found.`, [{ field: 'courseId', message: 'course does not exist.' }]);
			if (!course.isActive) throw new ServiceError('COURSE_NOT_ACTIVE', `Course ${courseId} is not active.`, [{ field: 'courseId', message: 'course is not active.' }]);
			let saved: EnrollmentRequestEntityReference | undefined;
			await uow.withScopedTransaction(async (r) => {
				const dup = (await r.getAll()).some((x) => x.isActive && x.props.courseId === courseId && x.props.learnerEmail.toLowerCase() === input.learnerEmail.value.toLowerCase());
				if (dup) throw new ServiceError('DUPLICATE_ACTIVE_REQUEST', 'Learner already has a pending or approved request for this course.');
				saved = (await r.save(r.getNewInstance(randomUUID(), input, new Date().toISOString()))).props;
			});
			return saved as EnrollmentRequestEntityReference;
		},

		async getById(id: string): Promise<EnrollmentRequestEntityReference> {
			const e = await repo.getById(id);
			if (!e) throw notFound();
			return e.props;
		},

		async list(filter: EnrollmentRequestFilter): Promise<{ items: EnrollmentRequestEntityReference[] }> {
			const { status, courseId, learnerEmail } = filter;
			if (status !== undefined && !isEnrollmentStatus(status)) throw invalid([{ field: 'status', message: 'status must be one of pending, approved, rejected, cancelled.' }]);
			const items = (await repo.getAll())
				.map((e) => e.props)
				.filter((p) => (!status || p.status === status) && (!courseId || p.courseId === courseId) && (!learnerEmail || p.learnerEmail.toLowerCase() === learnerEmail.toLowerCase()));
			return { items };
		},

		async changeStatus(id: string, body: unknown): Promise<EnrollmentRequestEntityReference> {
			const { status = '', changedBy = '', reason } = strings(body, ['status', 'changedBy'], ['reason']);
			if (!isEnrollmentStatus(status)) throw invalid([{ field: 'status', message: 'status must be one of pending, approved, rejected, cancelled.' }]);
			let saved: EnrollmentRequestEntityReference | undefined;
			await uow.withScopedTransaction(async (r) => {
				const e = await r.getById(id);
				if (!e) throw notFound();
				try {
					e.changeStatus(status, changedBy, reason, new Date().toISOString());
				} catch (err) {
					mapDomainError(err);
				}
				saved = (await r.save(e)).props;
			});
			return saved as EnrollmentRequestEntityReference;
		},
	};
}
