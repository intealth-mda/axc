import { Course, type CourseProps, type CourseRepository, EnrollmentRequest, type EnrollmentRequestRepository, type NewEnrollmentRequestInput } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { courseSeed } from './course-seed.ts';

class InMemoryRepository<T extends { id: string }> {
	private readonly items = new Map<string, T>();

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

export class InMemoryCourseRepository extends InMemoryRepository<Course> implements CourseRepository {
	constructor(seed: CourseProps[] = courseSeed) {
		super();
		for (const props of seed) {
			void this.save(this.getNewInstance({ ...props, tags: [...props.tags] }));
		}
	}

	getNewInstance(props: CourseProps): Course {
		return new Course(props);
	}
}

export class InMemoryEnrollmentRequestRepository extends InMemoryRepository<EnrollmentRequest> implements EnrollmentRequestRepository {
	getNewInstance(id: string, input: NewEnrollmentRequestInput, now: string): EnrollmentRequest {
		return EnrollmentRequest.create(id, input, now);
	}
}
