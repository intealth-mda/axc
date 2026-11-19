import { Course, type CourseProps, type CourseRepository, EnrollmentRequest, type EnrollmentRequestRepository, type Justification, type LearnerEmail } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';

class InMemoryRepository<T extends { id: string }> {
	protected readonly items = new Map<string, T>();
	getById(id: string): Promise<T | undefined> {
		return Promise.resolve(this.items.get(id));
	}
	async get(id: string): Promise<T> {
		const item = await this.getById(id);
		if (!item) throw new NotFoundError(`Not found: ${id}`);
		return item;
	}
	save(item: T): Promise<T> {
		this.items.set(item.id, item);
		return Promise.resolve(item);
	}
	getAll(): Promise<T[]> {
		return Promise.resolve([...this.items.values()]);
	}
}

export class InMemoryCourseRepository extends InMemoryRepository<Course> implements CourseRepository {
	constructor(seed: readonly CourseProps[] = []) {
		super();
		for (const p of seed) this.items.set(p.id, Course.getNewInstance(p));
	}
	getNewInstance(props: CourseProps): Course {
		return Course.getNewInstance(props);
	}
}

export class InMemoryEnrollmentRequestRepository extends InMemoryRepository<EnrollmentRequest> implements EnrollmentRequestRepository {
	getNewInstance(id: string, courseId: string, learnerEmail: LearnerEmail, justification: Justification, now: string): EnrollmentRequest {
		return EnrollmentRequest.getNewInstance(id, courseId, learnerEmail, justification, now);
	}
}
