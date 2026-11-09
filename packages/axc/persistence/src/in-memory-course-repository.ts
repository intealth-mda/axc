import { Course, type CourseInput, type CourseProps, type CourseRepository } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';

export class InMemoryCourseRepository implements CourseRepository {
	readonly #items = new Map<string, Course>();

	constructor(seed: readonly CourseProps[] = []) {
		for (const p of seed) this.#items.set(p.id, new Course(p, undefined));
	}

	getNewInstance(id: string, input: CourseInput, now: string): Course {
		return Course.getNewInstance(id, input, now);
	}

	get(id: string): Promise<Course> {
		const item = this.#items.get(id);
		return item ? Promise.resolve(item) : Promise.reject(new NotFoundError(`Course ${id} not found`));
	}

	getById(id: string): Promise<Course> {
		return this.get(id);
	}

	getAll(): Promise<Course[]> {
		return Promise.resolve([...this.#items.values()]);
	}

	save(item: Course): Promise<Course> {
		this.#items.set(item.id, item);
		return Promise.resolve(item);
	}
}
