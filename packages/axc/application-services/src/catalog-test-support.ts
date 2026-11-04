import type { Course, CourseRepository, EnrollmentRequest, EnrollmentRequestRepository } from '@axc/domain';
import type { CatalogDependencies } from './catalog.ts';

export function createCatalogDependencies(overrides?: Partial<CatalogDependencies>): CatalogDependencies {
	return {
		courses: overrides?.courses ?? inMemoryCourses([]),
		enrollmentRequests: overrides?.enrollmentRequests ?? inMemoryEnrollmentRequests(),
		now: overrides?.now ?? (() => new Date('2026-06-27T10:00:00.000Z')),
		newEnrollmentId: overrides?.newEnrollmentId ?? sequentialEnrollmentIds(),
	};
}

export function inMemoryCourses(courses: readonly Course[]): CourseRepository {
	const items = courses.map(cloneCourse);
	return {
		list() {
			return Promise.resolve(items.map(cloneCourse));
		},
		getById(id: string) {
			const found = items.find((course) => course.id === id);
			return Promise.resolve(found === undefined ? undefined : cloneCourse(found));
		},
	};
}

function inMemoryEnrollmentRequests(initial: readonly EnrollmentRequest[] = []): EnrollmentRequestRepository {
	const items = initial.map(cloneEnrollment);
	return {
		list() {
			return Promise.resolve(items.map(cloneEnrollment));
		},
		getById(id: string) {
			const found = items.find((request) => request.id === id);
			return Promise.resolve(found === undefined ? undefined : cloneEnrollment(found));
		},
		add(request: EnrollmentRequest) {
			items.push(cloneEnrollment(request));
			return Promise.resolve();
		},
		save(request: EnrollmentRequest) {
			const index = items.findIndex((item) => item.id === request.id);
			if (index >= 0) {
				items[index] = cloneEnrollment(request);
			}
			return Promise.resolve();
		},
	};
}

function sequentialEnrollmentIds(): () => string {
	let next = 1;
	return () => {
		const id = `enroll-${String(next).padStart(3, '0')}`;
		next += 1;
		return id;
	};
}

function cloneCourse(course: Course): Course {
	return { ...course, tags: [...course.tags] };
}

function cloneEnrollment(request: EnrollmentRequest): EnrollmentRequest {
	return {
		...request,
		statusHistory: request.statusHistory.map((entry) => ({ ...entry })),
	};
}
