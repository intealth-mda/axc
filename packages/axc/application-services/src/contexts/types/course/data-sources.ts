import { Course, type CourseEntityReference, type CourseProps, catalogCourses, PassportFactory } from '@axc/domain';
import { createEnrollmentRequestMemory, type EnrollmentRequestMemoryReadRepository, type EnrollmentRequestMemoryUnitOfWork } from '../enrollment-request/memory.ts';

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
			EnrollmentRequest: {
				EnrollmentRequestReadRepo: EnrollmentRequestMemoryReadRepository;
			};
		};
	};
	domainDataSource: {
		Types: {
			EnrollmentRequest: {
				EnrollmentRequestUnitOfWork: EnrollmentRequestMemoryUnitOfWork;
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
	const enrollmentRequests = createEnrollmentRequestMemory(passport);

	return {
		readonlyDataSource: {
			Types: {
				Course: {
					CourseReadRepo: repository,
				},
				EnrollmentRequest: {
					EnrollmentRequestReadRepo: enrollmentRequests.readRepository,
				},
			},
		},
		domainDataSource: {
			Types: {
				EnrollmentRequest: {
					EnrollmentRequestUnitOfWork: enrollmentRequests.unitOfWork,
				},
			},
		},
	};
}
