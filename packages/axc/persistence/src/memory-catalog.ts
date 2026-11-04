import type { Course, CourseRepository, EnrollmentRequest, EnrollmentRequestRepository } from '@axc/domain';
import { seedCourses } from '@axc/domain';

export function createCourseRepository(courses: readonly Course[] = seedCourses): CourseRepository {
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

export function createEnrollmentRequestRepository(initial: readonly EnrollmentRequest[] = []): EnrollmentRequestRepository {
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

function cloneCourse(course: Course): Course {
	return { ...course, tags: [...course.tags] };
}

function cloneEnrollment(request: EnrollmentRequest): EnrollmentRequest {
	return {
		...request,
		statusHistory: request.statusHistory.map((entry) => ({ ...entry })),
	};
}
