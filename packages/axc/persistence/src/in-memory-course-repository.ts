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

	getById(id: string): Promise<Course | undefined> {
		return Promise.resolve(this.#items.get(id));
	}

	async get(id: string): Promise<Course> {
		const c = await this.getById(id);
		if (c === undefined) throw new NotFoundError(`course ${id} not found`);
		return c;
	}

	save(item: Course): Promise<Course> {
		this.#items.set(item.id, item);
		return Promise.resolve(item);
	}

	getAll(): Promise<readonly Course[]> {
		return Promise.resolve([...this.#items.values()]);
	}
}
