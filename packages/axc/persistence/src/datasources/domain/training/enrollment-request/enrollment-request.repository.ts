import { randomUUID } from 'node:crypto';
import { Domain } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';

type E = Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequestProps;
type Passport = Domain.Contexts.Passport;
const { EnrollmentRequest } = Domain.Contexts.Training.EnrollmentRequest;
export const enrollmentRequestRepository = (store: Map<string, E>, passport: Passport): Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequestRepository<E> => ({
	get: (id) => {
		const props = store.get(id);
		if (!props) throw new NotFoundError('Enrollment request not found.');
		return Promise.resolve(new EnrollmentRequest(structuredClone(props), passport));
	},
	save: (item) => {
		store.set(item.id, structuredClone(item.props));
		return Promise.resolve(item);
	},
	getNewInstance: (input) => Promise.resolve(EnrollmentRequest.getNewInstance({ id: `enroll-${randomUUID()}` } as E, passport, input)),
	hasActive: (courseId, learnerEmail) =>
		Promise.resolve([...store.values()].some((item) => item.courseId === courseId.trim() && item.learnerEmail === learnerEmail.trim().toLowerCase() && (item.status === 'pending' || item.status === 'approved'))),
});
