import { EnrollmentRequest, type EnrollmentRequestFilter, type EnrollmentRequestRepository, type NewEnrollmentRequest } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';

export class InMemoryEnrollmentRequestRepository implements EnrollmentRequestRepository {
	readonly #items = new Map<string, EnrollmentRequest>();
	getNewInstance(id: string, input: NewEnrollmentRequest, now: string): EnrollmentRequest {
		return EnrollmentRequest.create(id, input, now);
	}
	getById(id: string): Promise<EnrollmentRequest | undefined> {
		return Promise.resolve(this.#items.get(id));
	}
	async get(id: string): Promise<EnrollmentRequest> {
		const r = await this.getById(id);
		if (!r) throw new NotFoundError(`Enrollment request ${id} not found`);
		return r;
	}
	find({ status, courseId, learnerEmail }: EnrollmentRequestFilter): Promise<EnrollmentRequest[]> {
		return Promise.resolve(
			[...this.#items.values()].filter(({ props: p }) => (!status || p.status === status) && (!courseId || p.courseId === courseId) && (!learnerEmail || p.learnerEmail.toLowerCase() === learnerEmail.toLowerCase())),
		);
	}
	save(item: EnrollmentRequest): Promise<EnrollmentRequest> {
		this.#items.set(item.id, item);
		return Promise.resolve(item);
	}
}
