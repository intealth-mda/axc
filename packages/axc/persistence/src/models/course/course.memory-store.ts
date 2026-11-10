import { Course, type CourseRepository, type CourseSearchCriteria, type CourseSearchPage, searchCourses } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { courseSeedRecords } from './course.seed.ts';

const publicPassport = { catalog: 'public' } as const;

function loadCourses(): Course[] {
	return courseSeedRecords.map((record) =>
		Course.getNewInstance(
			{
				id: record.id,
				title: record.title,
				summary: record.summary,
				modality: record.modality,
				status: record.status,
				tags: [...record.tags],
				createdAt: record.createdAt,
				updatedAt: record.updatedAt,
			},
			publicPassport,
		),
	);
}

class CourseMemoryStore implements CourseRepository {
	private readonly courses: readonly Course[] = loadCourses();

	public get(id: string): Promise<Course> {
		const found = this.courses.find((course) => course.id === id);
		if (!found) {
			return Promise.reject(new NotFoundError(`Item with id ${id} not found`));
		}
		return Promise.resolve(found);
	}

	public save(_item: Course): Promise<Course> {
		return Promise.reject(new Error('Course catalog is read-only'));
	}

	public search(criteria: CourseSearchCriteria): Promise<CourseSearchPage> {
		return Promise.resolve(searchCourses(this.courses, criteria));
	}
}

export function createCourseRepository(): CourseRepository {
	return new CourseMemoryStore();
}
