import { Course, type CourseProps, type CourseRepository } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';

export class InMemoryCourseRepository implements CourseRepository {
	readonly #items = new Map<string, Course>();

	constructor(seed: readonly CourseProps[] = []) {
		for (const props of seed) this.#items.set(props.id, new Course({ ...props }, undefined));
	}

	getNewInstance(id: string, input: Omit<CourseProps, 'id' | 'createdAt' | 'updatedAt'>, now: string): Course {
		return new Course({ ...input, id, createdAt: now, updatedAt: now }, undefined);
	}

	getById(id: string): Promise<Course | undefined> {
		return Promise.resolve(this.#items.get(id));
	}

	async get(id: string): Promise<Course> {
		const item = await this.getById(id);
		if (item === undefined) throw new NotFoundError(`Course ${id} not found`);
		return item;
	}

	getAll(): Promise<Course[]> {
		return Promise.resolve([...this.#items.values()]);
	}

	save(item: Course): Promise<Course> {
		this.#items.set(item.id, item);
		return Promise.resolve(item);
	}
}
