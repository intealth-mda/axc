import { Course, type CourseRepository } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { COURSE_SEED } from './course-seed.ts';

export class InMemoryCourseRepository implements CourseRepository {
	readonly #items = new Map(COURSE_SEED.map((p) => [p.id, Course.create({ ...p })]));

	getNewInstance(id: string, input: Parameters<CourseRepository['getNewInstance']>[1], now: string): Course {
		return Course.create({ ...input, id, createdAt: now, updatedAt: now });
	}

	getById(id: string): Promise<Course | undefined> {
		return Promise.resolve(this.#items.get(id));
	}

	async get(id: string): Promise<Course> {
		const c = await this.getById(id);
		if (!c) throw new NotFoundError(`Course ${id} not found`);
		return c;
	}

	save(item: Course): Promise<Course> {
		this.#items.set(item.id, item);
		return Promise.resolve(item);
	}

	findAll(): Promise<Course[]> {
		return Promise.resolve([...this.#items.values()]);
	}
}
