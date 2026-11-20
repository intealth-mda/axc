import { Course, type CourseProps, type CourseRepository } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { courseSeed } from './course-seed.ts';

export class InMemoryCourseRepository implements CourseRepository {
	private readonly items = new Map<string, Course>();

	constructor(seed: CourseProps[] = courseSeed) {
		for (const p of seed) this.items.set(p.id, Course.create(p));
	}

	getNewInstance(props: CourseProps): Course {
		return Course.create(props);
	}

	get(id: string): Promise<Course> {
		const c = this.items.get(id);
		return c ? Promise.resolve(c) : Promise.reject(new NotFoundError(`course ${id} not found`));
	}

	getById(id: string): Promise<Course> {
		return this.get(id);
	}

	getAll(): Promise<Course[]> {
		return Promise.resolve([...this.items.values()]);
	}

	save(item: Course): Promise<Course> {
		this.items.set(item.id, item);
		return Promise.resolve(item);
	}
}
