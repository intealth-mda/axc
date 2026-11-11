import { Course, type CourseProps, type CourseRepository, EnrollmentRequest, type EnrollmentRequestRepository, type NewEnrollmentRequest } from '@axc/domain';
import type { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { courseSeed } from './course-seed.ts';

/** Map-backed store shared by the in-memory repositories. */
class InMemoryStore<T extends AggregateRoot<DomainEntityProps, undefined>> {
	readonly #items = new Map<string, T>();

	get(id: string): Promise<T> {
		const item = this.#items.get(id);
		return item ? Promise.resolve(item) : Promise.reject(new NotFoundError(`${id} not found`));
	}

	getById(id: string): Promise<T | undefined> {
		return Promise.resolve(this.#items.get(id));
	}

	getAll(): Promise<T[]> {
		return Promise.resolve([...this.#items.values()]);
	}

	save(item: T): Promise<T> {
		this.#items.set(item.id, item);
		return Promise.resolve(item);
	}
}

export class InMemoryCourseRepository extends InMemoryStore<Course> implements CourseRepository {
	constructor(seed: readonly CourseProps[] = courseSeed) {
		super();
		for (const props of seed) void this.save(Course.getNewInstance(props));
	}

	getNewInstance(props: CourseProps): Course {
		return Course.getNewInstance(props);
	}
}

export class InMemoryEnrollmentRequestRepository extends InMemoryStore<EnrollmentRequest> implements EnrollmentRequestRepository {
	getNewInstance(id: string, input: NewEnrollmentRequest, now: string): EnrollmentRequest {
		return EnrollmentRequest.getNewInstance(id, input, now);
	}
}
