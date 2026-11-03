import { type CourseRepository, type EnrollmentRequest, type EnrollmentRequestEntityReference, type EnrollmentRequestRepository, EnrollmentValidationError, InvalidStatusTransitionError } from '@axc/domain';
import { ServiceError } from './service-error.ts';

export interface EnrollmentRequestsService {
	create(body: unknown): Promise<EnrollmentRequestEntityReference>;
	getById(id: string): Promise<EnrollmentRequestEntityReference>;
	list(filters: Record<string, string>): Promise<{ items: EnrollmentRequestEntityReference[] }>;
	changeStatus(id: string, body: unknown): Promise<EnrollmentRequestEntityReference>;
}

const asRecord = (body: unknown): Record<string, unknown> => {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) throw new ServiceError('INVALID_REQUEST', 'Request body must be a JSON object.');
	return body as Record<string, unknown>;
};

/** Maps domain rule violations to service errors. */
const domainCall = <T>(fn: () => T): T => {
	try {
		return fn();
	} catch (err) {
		if (err instanceof EnrollmentValidationError) throw new ServiceError('INVALID_REQUEST', 'The request could not be completed.', [{ field: err.field, message: err.message }]);
		if (err instanceof InvalidStatusTransitionError) throw new ServiceError('INVALID_STATUS_TRANSITION', err.message);
		throw err;
	}
};

export const enrollmentRequestsService = (courses: CourseRepository, requests: EnrollmentRequestRepository): EnrollmentRequestsService => {
	const find = async (id: string): Promise<EnrollmentRequest> => {
		const request = await requests.getById(id);
		if (!request) throw new ServiceError('ENROLLMENT_REQUEST_NOT_FOUND', `Enrollment request ${id} was not found.`);
		return request;
	};
	return {
		async create(body) {
			const { courseId, learnerEmail, justification } = asRecord(body);
			if (typeof courseId !== 'string' || courseId === '') throw new ServiceError('INVALID_REQUEST', 'The request could not be completed.', [{ field: 'courseId', message: 'courseId is required.' }]);
			const request = domainCall(() => requests.getNewInstance({ courseId, learnerEmail, justification }));
			const course = await courses.getById(courseId);
			if (!course) throw new ServiceError('COURSE_NOT_FOUND', `Course ${courseId} was not found.`);
			if (!course.isActive) throw new ServiceError('COURSE_NOT_ACTIVE', `Course ${courseId} is not active.`);
			const duplicate = (await requests.getAll()).some((r) => r.isActive && r.props.courseId === courseId && r.props.learnerEmail.toLowerCase() === request.props.learnerEmail.toLowerCase());
			if (duplicate) throw new ServiceError('DUPLICATE_ACTIVE_REQUEST', 'The learner already has a pending or approved request for this course.');
			return (await requests.save(request)).props;
		},
		async getById(id) {
			return (await find(id)).props;
		},
		async list({ status, courseId, learnerEmail }) {
			const items = (await requests.getAll())
				.map((r) => r.props)
				.filter((r) => (status === undefined || r.status === status) && (courseId === undefined || r.courseId === courseId) && (learnerEmail === undefined || r.learnerEmail.toLowerCase() === learnerEmail.toLowerCase()));
			return { items };
		},
		async changeStatus(id, body) {
			const { status, changedBy, reason } = asRecord(body);
			const request = await find(id);
			domainCall(() => request.changeStatus(status, changedBy, reason, new Date().toISOString()));
			return (await requests.save(request)).props;
		},
	};
};
