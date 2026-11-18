import { Course, type CourseProps, type CourseRepository, EnrollmentRequest, type EnrollmentRequestFilter, type EnrollmentRequestRepository, type NewCourseInput, type NewEnrollmentRequestInput } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';

class InMemoryRepository<T extends { id: string }> {
	protected readonly items = new Map<string, T>();
	get(id: string): Promise<T> {
		const item = this.items.get(id);
		return item ? Promise.resolve(item) : Promise.reject(new NotFoundError(`${id} not found`));
	}
	getById(id: string): Promise<T | undefined> {
		return Promise.resolve(this.items.get(id));
	}
	save(item: T): Promise<T> {
		this.items.set(item.id, item);
		return Promise.resolve(item);
	}
}

export class InMemoryCourseRepository extends InMemoryRepository<Course> implements CourseRepository {
	constructor(seed: CourseProps[] = []) {
		super();
		for (const props of seed) this.items.set(props.id, Course.fromProps({ ...props, tags: [...props.tags] }));
	}
	getNewInstance(id: string, input: NewCourseInput, now: string): Course {
		return Course.getNewInstance(id, input, now);
	}
	getAll(): Promise<Course[]> {
		return Promise.resolve([...this.items.values()]);
	}
}

export class InMemoryEnrollmentRequestRepository extends InMemoryRepository<EnrollmentRequest> implements EnrollmentRequestRepository {
	getNewInstance(id: string, input: NewEnrollmentRequestInput, now: string): EnrollmentRequest {
		return EnrollmentRequest.getNewInstance(id, input, now);
	}
	find(filter: EnrollmentRequestFilter): Promise<EnrollmentRequest[]> {
		const email = filter.learnerEmail?.toLowerCase();
		return Promise.resolve(
			[...this.items.values()].filter((r) => {
				const p = r.toReference();
				return (!filter.status || p.status === filter.status) && (!filter.courseId || p.courseId === filter.courseId) && (!email || p.learnerEmail.toLowerCase() === email);
			}),
		);
	}
}
