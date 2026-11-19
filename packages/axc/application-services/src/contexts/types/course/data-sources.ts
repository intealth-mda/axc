import { Course, type CourseEntityReference, type CourseProps, catalogCourses, PassportFactory } from '@axc/domain';

export interface CourseReadRepository {
	getAll(): Promise<CourseEntityReference[]>;
	getById(id: string): Promise<CourseEntityReference | null>;
}

export interface DataSources {
	readonlyDataSource: {
		Types: {
			Course: {
				CourseReadRepo: CourseReadRepository;
			};
		};
	};
}

type CourseEntity = CourseEntityReference;

export function createCourseCatalogDataSources(): DataSources {
	const passport = PassportFactory.forSystem();
	const courses: CourseEntity[] = catalogCourses.map((record) => {
		const props: CourseProps = {
			id: record.id,
			title: record.title,
			summary: record.summary,
			modality: record.modality,
			status: record.status,
			tags: [...record.tags],
			createdAt: new Date(record.createdAt),
			updatedAt: new Date(record.updatedAt),
			schemaVersion: '1.0.0',
		};
		return new Course(props, passport);
	});

	const repository: CourseReadRepository = {
		getAll(): Promise<CourseEntity[]> {
			return Promise.resolve(courses);
		},
		getById(id: string): Promise<CourseEntity | null> {
			return Promise.resolve(courses.find((course) => course.id === id) ?? null);
		},
	};

	return {
		readonlyDataSource: {
			Types: {
				Course: {
					CourseReadRepo: repository,
				},
			},
		},
	};
}
