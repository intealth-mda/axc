import { Course, type CourseProps, type CourseRepository, type NewCourseInput } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';

export class InMemoryCourseRepository implements CourseRepository {
	private readonly items = new Map<string, CourseProps>();
	constructor(seed: CourseProps[] = []) {
		for (const p of seed) this.items.set(p.id, { ...p, tags: [...p.tags] });
	}
	getNewInstance(id: string, input: NewCourseInput, now: string): Course {
		return Course.getNewInstance(id, input, now);
	}
	getById(id: string): Promise<Course> {
		return this.get(id);
	}
	get(id: string): Promise<Course> {
		const p = this.items.get(id);
		if (!p) return Promise.reject(new NotFoundError(`course ${id} not found`));
		return Promise.resolve(new Course({ ...p, tags: [...p.tags] }, undefined));
	}
	getAll(): Promise<Course[]> {
		return Promise.resolve([...this.items.values()].map((p) => new Course({ ...p, tags: [...p.tags] }, undefined)));
	}
	save(item: Course): Promise<Course> {
		this.items.set(item.id, item.toReference() as CourseProps);
		return Promise.resolve(item);
	}
}
