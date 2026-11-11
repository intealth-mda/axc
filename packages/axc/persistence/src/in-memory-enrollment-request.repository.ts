import { EnrollmentRequest, type EnrollmentRequestFilter, type EnrollmentRequestRepository, type NewEnrollmentRequest } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';

export class InMemoryEnrollmentRequestRepository implements EnrollmentRequestRepository {
	readonly #items = new Map<string, EnrollmentRequest>();

	getNewInstance(id: string, input: NewEnrollmentRequest, now: string): EnrollmentRequest {
		return EnrollmentRequest.getNewInstance(id, input, now);
	}

	getById(id: string): Promise<EnrollmentRequest | undefined> {
		return Promise.resolve(this.#items.get(id));
	}

	async get(id: string): Promise<EnrollmentRequest> {
		const item = await this.getById(id);
		if (item === undefined) throw new NotFoundError(`Enrollment request ${id} not found`);
		return item;
	}

	find({ status, courseId, learnerEmail }: EnrollmentRequestFilter): Promise<EnrollmentRequest[]> {
		const email = learnerEmail?.toLowerCase();
		return Promise.resolve(
			[...this.#items.values()].filter(({ props: p }) => (status === undefined || p.status === status) && (courseId === undefined || p.courseId === courseId) && (email === undefined || p.learnerEmail.toLowerCase() === email)),
		);
	}

	save(item: EnrollmentRequest): Promise<EnrollmentRequest> {
		this.#items.set(item.id, item);
		return Promise.resolve(item);
	}
}
