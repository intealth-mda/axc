import { Course, type CourseRepository, type NewCourseInput } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { courseSeed } from './course-seed.ts';

export class InMemoryCourseRepository implements CourseRepository {
	readonly #items = new Map<string, Course>(courseSeed.map((p) => [p.id, new Course({ ...p, tags: [...p.tags] }, undefined)]));

	getNewInstance(id: string, input: NewCourseInput, now: string): Course {
		return Course.getNewInstance(id, input, now);
	}

	getById(id: string): Promise<Course | undefined> {
		return Promise.resolve(this.#items.get(id));
	}

	async get(id: string): Promise<Course> {
		const found = await this.getById(id);
		if (!found) throw new NotFoundError(`Course ${id} not found`);
		return found;
	}

	getAll(): Promise<Course[]> {
		return Promise.resolve([...this.#items.values()]);
	}

	save(item: Course): Promise<Course> {
		this.#items.set(item.id, item);
		return Promise.resolve(item);
	}
}
