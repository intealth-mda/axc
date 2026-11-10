import { Course, type CoursePassport, type CourseRepository, type CourseSearchCriteria, type CourseSearchPage, searchCourseCatalog } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { COURSE_SEED } from './course-seed.ts';

const READ_PASSPORT: CoursePassport = { kind: 'course-catalog' };

class MemoryCourseRepository implements CourseRepository {
	private readonly courses: Course[];

	public constructor(courses: Course[]) {
		this.courses = courses;
	}

	public get(id: string): Promise<Course> {
		const found = this.courses.find((course) => course.id === id);
		if (found === undefined) {
			return Promise.reject(new NotFoundError(`Item with id ${id} not found`));
		}
		return Promise.resolve(found);
	}

	public save(item: Course): Promise<Course> {
		const index = this.courses.findIndex((course) => course.id === item.id);
		if (index === -1) {
			this.courses.push(item);
			return Promise.resolve(item);
		}
		this.courses[index] = item;
		return Promise.resolve(item);
	}

	public search(criteria: CourseSearchCriteria): Promise<CourseSearchPage> {
		return Promise.resolve(searchCourseCatalog(this.courses, criteria));
	}
}

export function createCourseCatalogRepository(): CourseRepository {
	const courses = COURSE_SEED.map((props) => Course.getNewInstance(props, READ_PASSPORT));
	return new MemoryCourseRepository(courses);
}
