import { type CatalogPassport, Course, type CourseProps, type CourseRepository } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';

const catalogPassport: CatalogPassport = { catalogRead: true };

function toCourse(props: CourseProps): Course {
	return Course.getNewInstance(
		{
			id: props.id,
			title: props.title,
			summary: props.summary,
			modality: props.modality,
			status: props.status,
			tags: [...props.tags],
			createdAt: props.createdAt,
			updatedAt: props.updatedAt,
		},
		catalogPassport,
	);
}

export class InMemoryCourseRepository implements CourseRepository {
	private readonly courses: CourseProps[];

	public constructor(seed: readonly CourseProps[]) {
		this.courses = seed.map((course) => ({ ...course, tags: [...course.tags] }));
	}

	public get(id: string): Promise<Course> {
		const found = this.courses.find((course) => course.id === id);
		if (found === undefined) {
			return Promise.reject(new NotFoundError(`Course ${id} was not found.`));
		}
		return Promise.resolve(toCourse(found));
	}

	public save(item: Course): Promise<Course> {
		const next: CourseProps = {
			id: item.id,
			title: item.props.title,
			summary: item.props.summary,
			modality: item.props.modality,
			status: item.props.status,
			tags: [...item.props.tags],
			createdAt: item.props.createdAt,
			updatedAt: item.props.updatedAt,
		};
		const index = this.courses.findIndex((course) => course.id === item.id);
		if (index === -1) {
			this.courses.push(next);
		} else {
			this.courses[index] = next;
		}
		return Promise.resolve(toCourse(next));
	}

	public list(): Promise<readonly Course[]> {
		return Promise.resolve(this.courses.map((course) => toCourse(course)));
	}
}
