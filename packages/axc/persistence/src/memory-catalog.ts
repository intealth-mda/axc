import { type Course, type CourseRepository, type EnrollmentRequest, type EnrollmentRequestRepository, seedCourses } from '@axc/domain';

export interface CatalogRepositories {
	courses: CourseRepository;
	enrollmentRequests: EnrollmentRequestRepository;
}

export function createCatalogRepositories(): CatalogRepositories {
	const courses = structuredClone(seedCourses) as Course[];
	const requests: EnrollmentRequest[] = [];

	return {
		courses: {
			list() {
				return Promise.resolve(structuredClone(courses));
			},
			getById(id: string) {
				const course = courses.find((item) => item.id === id);
				return Promise.resolve(course === undefined ? undefined : structuredClone(course));
			},
		},
		enrollmentRequests: {
			list() {
				return Promise.resolve(structuredClone(requests));
			},
			getById(id: string) {
				const request = requests.find((item) => item.id === id);
				return Promise.resolve(request === undefined ? undefined : structuredClone(request));
			},
			add(request: EnrollmentRequest) {
				requests.push(structuredClone(request));
				return Promise.resolve();
			},
			save(request: EnrollmentRequest) {
				const index = requests.findIndex((item) => item.id === request.id);
				if (index === -1) {
					return Promise.reject(new Error(`Enrollment request ${request.id} does not exist.`));
				}
				requests[index] = structuredClone(request);
				return Promise.resolve();
			},
		},
	};
}
