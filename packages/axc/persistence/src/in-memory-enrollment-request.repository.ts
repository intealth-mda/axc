import { EnrollmentRequest, type EnrollmentRequestFilter, type EnrollmentRequestRepository } from '@axc/domain';

export class InMemoryEnrollmentRequestRepository implements EnrollmentRequestRepository {
	readonly #items = new Map<string, EnrollmentRequest>();
	getNewInstance = EnrollmentRequest.getNewInstance;
	getById(id: string) {
		return Promise.resolve(this.#items.get(id));
	}
	async get(id: string) {
		const item = await this.getById(id);
		if (!item) throw new Error(`Enrollment request ${id} not found`);
		return item;
	}
	find({ status, courseId, learnerEmail }: EnrollmentRequestFilter) {
		const email = learnerEmail?.toLowerCase();
		return Promise.resolve([...this.#items.values()].filter(({ props: p }) => (!status || p.status === status) && (!courseId || p.courseId === courseId) && (!email || p.learnerEmail === email)));
	}
	save(item: EnrollmentRequest) {
		this.#items.set(item.id, item);
		return Promise.resolve(item);
	}
}
