import { Course, type CourseProps, type CourseRepository } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';

export class InMemoryCourseRepository implements CourseRepository {
	readonly #items = new Map<string, Course>();
	constructor(seed: readonly CourseProps[] = []) {
		for (const p of seed) this.#items.set(p.id, this.getNewInstance(p));
	}
	getNewInstance(props: CourseProps): Course {
		return new Course(props, undefined);
	}
	getById(id: string): Promise<Course | undefined> {
		return Promise.resolve(this.#items.get(id));
	}
	async get(id: string): Promise<Course> {
		const c = await this.getById(id);
		if (!c) throw new NotFoundError(`Course ${id} not found`);
		return c;
	}
	getAll(): Promise<Course[]> {
		return Promise.resolve([...this.#items.values()]);
	}
	save(item: Course): Promise<Course> {
		this.#items.set(item.id, item);
		return Promise.resolve(item);
	}
}
