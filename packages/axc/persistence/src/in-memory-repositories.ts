import { Course, type CourseProps, type CourseRepository, EnrollmentRequest, type EnrollmentRequestRepository } from '@axc/domain';
import type { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { courseSeed } from './course-seed.ts';

class InMemoryRepository<T extends AggregateRoot<DomainEntityProps, undefined>> {
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

export class InMemoryCourseRepository extends InMemoryRepository<Course> implements CourseRepository {
	constructor(seed: CourseProps[] = courseSeed) {
		super();
		for (const p of seed) this.items.set(p.id, this.getNewInstance(p));
	}
	getNewInstance(props: CourseProps): Course {
		return new Course(props, undefined);
	}
}

export class InMemoryEnrollmentRequestRepository extends InMemoryRepository<EnrollmentRequest> implements EnrollmentRequestRepository {
	getNewInstance(...args: Parameters<typeof EnrollmentRequest.create>): EnrollmentRequest {
		return EnrollmentRequest.create(...args);
	}
}
