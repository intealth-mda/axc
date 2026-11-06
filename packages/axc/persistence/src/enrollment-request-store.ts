import { type EnrollmentRequest, type EnrollmentRequestStore, isDuplicateActiveEnrollment, type SaveEnrollmentRequestResult } from '@axc/domain';

/** In-memory enrollment requests for one API process. */
export function createEnrollmentRequestStore(): EnrollmentRequestStore {
	const requests: EnrollmentRequest[] = [];
	let sequence = 0;

	return {
		list(): Promise<readonly EnrollmentRequest[]> {
			return Promise.resolve([...requests]);
		},
		findById(id: string): Promise<EnrollmentRequest | undefined> {
			return Promise.resolve(requests.find((request) => request.id === id));
		},
		save(request: EnrollmentRequest): Promise<SaveEnrollmentRequestResult> {
			const index = requests.findIndex((existing) => existing.id === request.id);
			if (index >= 0) {
				requests[index] = request;
				return Promise.resolve('updated');
			}
			const duplicate = requests.some((existing) => isDuplicateActiveEnrollment(existing, request.courseId, request.learnerEmail));
			if (duplicate) {
				return Promise.resolve('duplicate-active');
			}
			requests.push(request);
			return Promise.resolve('inserted');
		},
		nextId(): string {
			sequence += 1;
			return `enroll-${String(sequence).padStart(3, '0')}`;
		},
	};
}
