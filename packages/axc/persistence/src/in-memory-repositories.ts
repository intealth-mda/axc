import { Course, type CourseProps, type CourseRepository, EnrollmentRequest, type EnrollmentRequestRepository, type NewEnrollmentRequest } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { COURSE_SEED } from './course-seed.ts';

class InMemoryStore<T extends { readonly id: string }> {
	protected readonly items = new Map<string, T>();

	get(id: string): Promise<T> {
		const item = this.items.get(id);
		return item ? Promise.resolve(item) : Promise.reject(new NotFoundError(`${id} not found`));
	}

	getById(id: string): Promise<T | undefined> {
		return Promise.resolve(this.items.get(id));
	}

	getAll(): Promise<T[]> {
		return Promise.resolve([...this.items.values()]);
	}

	save(item: T): Promise<T> {
		this.items.set(item.id, item);
		return Promise.resolve(item);
	}
}

export class InMemoryCourseRepository extends InMemoryStore<Course> implements CourseRepository {
	constructor(seed: readonly CourseProps[] = COURSE_SEED) {
		super();
		for (const props of seed) this.items.set(props.id, Course.getNewInstance(props));
	}

	getNewInstance(props: CourseProps): Promise<Course> {
		return Promise.resolve(Course.getNewInstance(props));
	}
}

export class InMemoryEnrollmentRequestRepository extends InMemoryStore<EnrollmentRequest> implements EnrollmentRequestRepository {
	getNewInstance(id: string, input: NewEnrollmentRequest, now: string): Promise<EnrollmentRequest> {
		return Promise.resolve(EnrollmentRequest.getNewInstance(id, input, now));
	}
}
