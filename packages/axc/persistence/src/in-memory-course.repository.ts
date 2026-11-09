import { Course, type CourseRepository } from '@axc/domain';
import { COURSE_SEED } from './course-seed.ts';

export class InMemoryCourseRepository implements CourseRepository {
	readonly #items = new Map(COURSE_SEED.map((p) => [p.id, new Course({ ...p }, undefined)]));
	getNewInstance = Course.getNewInstance;
	getById(id: string) {
		return Promise.resolve(this.#items.get(id));
	}
	async get(id: string) {
		const item = await this.getById(id);
		if (!item) throw new Error(`Course ${id} not found`);
		return item;
	}
	getAll() {
		return Promise.resolve([...this.#items.values()]);
	}
	save(item: Course) {
		this.#items.set(item.id, item);
		return Promise.resolve(item);
	}
}
