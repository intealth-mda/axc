import { Course, type CourseRepository, type NewCourseInput } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { courseSeed } from './course-seed.ts';

export class InMemoryCourseRepository implements CourseRepository {
	readonly #items = new Map<string, Course>(courseSeed.map((p) => [p.id, new Course(p, undefined)]));

	getNewInstance(id: string, input: NewCourseInput, now: string): Course {
		return Course.getNewInstance(id, input, now);
	}

	get(id: string): Promise<Course> {
		const item = this.#items.get(id);
		return item ? Promise.resolve(item) : Promise.reject(new NotFoundError(`course ${id} not found`));
	}

	getById(id: string): Promise<Course> {
		return this.get(id);
	}

	getAll(): Promise<readonly Course[]> {
		return Promise.resolve([...this.#items.values()]);
	}

	save(item: Course): Promise<Course> {
		this.#items.set(item.id, item);
		return Promise.resolve(item);
	}
}
