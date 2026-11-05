import { Course, type CourseInput, type CourseProps, type CourseRepository } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';

export class InMemoryCourseRepository implements CourseRepository {
	private readonly items = new Map<string, Course>();

	constructor(seed: CourseProps[] = []) {
		for (const props of seed) {
			this.items.set(props.id, new Course({ ...props }, undefined));
		}
	}

	getNewInstance(id: string, input: CourseInput, now: string): Course {
		return Course.getNewInstance(id, input, now);
	}

	get(id: string): Promise<Course> {
		return this.getById(id);
	}

	getById(id: string): Promise<Course> {
		const item = this.items.get(id);
		return item ? Promise.resolve(item) : Promise.reject(new NotFoundError(`Course ${id} not found`));
	}

	save(item: Course): Promise<Course> {
		this.items.set(item.id, item);
		return Promise.resolve(item);
	}

	getAll(): Promise<Course[]> {
		return Promise.resolve([...this.items.values()]);
	}
}
