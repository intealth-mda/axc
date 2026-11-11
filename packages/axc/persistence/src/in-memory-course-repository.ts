import { Course, type CourseProps, type CourseRepository } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';

export class InMemoryCourseRepository implements CourseRepository {
	readonly #items = new Map<string, Course>();

	constructor(seed: readonly CourseProps[] = []) {
		for (const props of seed) this.#items.set(props.id, Course.getNewInstance(props));
	}

	getNewInstance(props: CourseProps): Course {
		return Course.getNewInstance(props);
	}

	async getById(id: string): Promise<Course> {
		const item = this.#items.get(id);
		if (!item) throw new NotFoundError(`course ${id} not found`);
		return await Promise.resolve(item);
	}

	get(id: string): Promise<Course> {
		return this.getById(id);
	}

	save(item: Course): Promise<Course> {
		this.#items.set(item.id, item);
		return Promise.resolve(item);
	}

	getAll(): Promise<Course[]> {
		return Promise.resolve([...this.#items.values()]);
	}
}
