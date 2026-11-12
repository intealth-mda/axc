import { Course, type CourseProps, type CourseRepository, type NewCourseInput } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';

export class InMemoryCourseRepository implements CourseRepository {
	readonly #items = new Map<string, CourseProps>();

	constructor(seed: CourseProps[] = []) {
		for (const p of seed) this.#items.set(p.id, { ...p, tags: [...p.tags] });
	}

	getNewInstance(id: string, input: NewCourseInput, now: string): Course {
		return Course.getNewInstance(id, input, now);
	}

	getById(id: string): Promise<Course> {
		const p = this.#items.get(id);
		return p ? Promise.resolve(new Course({ ...p, tags: [...p.tags] }, undefined)) : Promise.reject(new NotFoundError(`course ${id} not found`));
	}

	get(id: string): Promise<Course> {
		return this.getById(id);
	}

	save(item: Course): Promise<Course> {
		this.#items.set(item.id, item.reference);
		return Promise.resolve(item);
	}

	getAll(): Promise<Course[]> {
		return Promise.resolve([...this.#items.values()].map((p) => new Course({ ...p, tags: [...p.tags] }, undefined)));
	}
}
