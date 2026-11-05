import { randomUUID } from 'node:crypto';
import { type CourseRepository, type EnrollmentRequestEntityReference, type EnrollmentRequestRepository, InvalidEnrollmentInputError, InvalidStatusTransitionError, isEnrollmentStatus } from '@axc/domain';
import { ServiceError } from './service-error.ts';

export interface EnrollmentRequestFilter {
	status?: string | undefined;
	courseId?: string | undefined;
	learnerEmail?: string | undefined;
}

const asRecord = (body: unknown): Record<string, unknown> => (typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {});

const domainCall = <T>(fn: () => T): T => {
	try {
		return fn();
	} catch (e) {
		if (e instanceof InvalidEnrollmentInputError) throw new ServiceError('INVALID_REQUEST', 'The request could not be completed.', [{ field: e.field, message: e.message }]);
		if (e instanceof InvalidStatusTransitionError) throw new ServiceError('INVALID_STATUS_TRANSITION', e.message);
		throw e;
	}
};

export const buildEnrollmentRequestService = (courses: CourseRepository, requests: EnrollmentRequestRepository) => {
	const load = async (id: string) => {
		const request = await requests.getById(id);
		if (!request) throw new ServiceError('ENROLLMENT_REQUEST_NOT_FOUND', `Enrollment request ${id} was not found.`);
		return request;
	};

	return {
		async create(body: unknown): Promise<EnrollmentRequestEntityReference> {
			const { courseId, learnerEmail, justification } = asRecord(body);
			const request = domainCall(() => requests.getNewInstance(randomUUID(), { courseId, learnerEmail, justification }, new Date().toISOString()));
			const course = await courses.getById(request.props.courseId);
			if (!course) throw new ServiceError('COURSE_NOT_FOUND', `Course ${request.props.courseId} was not found.`);
			if (!course.isActive) throw new ServiceError('COURSE_NOT_ACTIVE', `Course ${course.id} is not active.`);
			const duplicate = (await requests.getAll()).some((r) => r.isActive && r.props.courseId === course.id && r.props.learnerEmail === request.props.learnerEmail);
			if (duplicate) throw new ServiceError('DUPLICATE_ACTIVE_REQUEST', 'The learner already has a pending or approved request for this course.');
			return (await requests.save(request)).props;
		},

		async get(id: string): Promise<EnrollmentRequestEntityReference> {
			return (await load(id)).props;
		},

		async list(filter: EnrollmentRequestFilter): Promise<EnrollmentRequestEntityReference[]> {
			const { status, courseId, learnerEmail } = filter;
			if (status !== undefined && !isEnrollmentStatus(status)) {
				throw new ServiceError('INVALID_REQUEST', 'The request could not be completed.', [{ field: 'status', message: 'status must be one of pending, approved, rejected, cancelled.' }]);
			}
			return (await requests.getAll())
				.map((r) => r.props)
				.filter((r) => (status ? r.status === status : true) && (courseId ? r.courseId === courseId : true) && (learnerEmail ? r.learnerEmail === learnerEmail.toLowerCase() : true));
		},

		async changeStatus(id: string, body: unknown): Promise<EnrollmentRequestEntityReference> {
			const request = await load(id);
			const { status, changedBy, reason } = asRecord(body);
			domainCall(() => request.changeStatus(status, changedBy, reason, new Date().toISOString()));
			return (await requests.save(request)).props;
		},
	};
};
