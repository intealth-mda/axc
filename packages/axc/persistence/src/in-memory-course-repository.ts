import { Course, type CourseRepository, type NewCourseInput } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';

export class InMemoryCourseRepository implements CourseRepository {
	readonly #items = new Map<string, Course>();
	constructor(seed: readonly Course[] = []) {
		for (const c of seed) this.#items.set(c.id, c);
	}
	getNewInstance(id: string, input: NewCourseInput, now: string): Course {
		return Course.getNewInstance(id, input, now);
	}
	get(id: string): Promise<Course> {
		return this.getById(id);
	}
	getById(id: string): Promise<Course> {
		const c = this.#items.get(id);
		return c ? Promise.resolve(c) : Promise.reject(new NotFoundError(`course ${id} not found`));
	}
	getAll(): Promise<Course[]> {
		return Promise.resolve([...this.#items.values()]);
	}
	save(item: Course): Promise<Course> {
		this.#items.set(item.id, item);
		return Promise.resolve(item);
	}
}
