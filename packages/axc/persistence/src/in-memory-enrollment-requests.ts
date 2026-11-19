import { EnrollmentRequest, type EnrollmentRequestStore, learnerEmailsMatch, type NewEnrollmentRequest } from '@axc/domain';

const ACTIVE_REQUEST_STATUSES = ['pending', 'approved'] as const;

/** Process-local enrollment requests. The collection lives for the life of the API process. */
export function createInMemoryEnrollmentRequestStore(): EnrollmentRequestStore {
	const requests: EnrollmentRequest[] = [];
	let sequence = 0;

	return {
		list() {
			return Promise.resolve([...requests]);
		},
		findById(id: string) {
			return Promise.resolve(requests.find((request) => request.id === id));
		},
		add(input: NewEnrollmentRequest) {
			const duplicate = requests.some((request) => request.courseId === input.courseId.trim() && learnerEmailsMatch(request.learnerEmail, input.learnerEmail.trim()) && isActiveStatus(request.status));
			if (duplicate) {
				return Promise.resolve({ added: false as const, reason: 'duplicate-active' as const });
			}
			sequence += 1;
			const request = EnrollmentRequest.open({
				id: formatEnrollmentId(sequence),
				courseId: input.courseId,
				learnerEmail: input.learnerEmail,
				justification: input.justification,
				createdAt: input.createdAt,
			});
			requests.push(request);
			return Promise.resolve({ added: true as const, request });
		},
		update(id: string, change: (current: EnrollmentRequest) => EnrollmentRequest) {
			const index = requests.findIndex((request) => request.id === id);
			const current = index < 0 ? undefined : requests[index];
			if (current === undefined) {
				return Promise.resolve(undefined);
			}
			const next = change(current);
			requests[index] = next;
			return Promise.resolve(next);
		},
	};
}

function formatEnrollmentId(sequence: number): string {
	const suffix = sequence < 1000 ? sequence.toString().padStart(3, '0') : String(sequence);
	return `enroll-${suffix}`;
}

function isActiveStatus(status: string): boolean {
	return ACTIVE_REQUEST_STATUSES.some((candidate) => candidate === status);
}
