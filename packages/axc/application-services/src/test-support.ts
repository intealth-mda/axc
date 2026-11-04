import { type Course, type CourseRepository, type EnrollmentRequest, type EnrollmentRequestRepository, seedCourses } from '@axc/domain';
import { type ApplicationDependencies, buildApplicationServicesFactory } from './index.ts';

export function createTestApplicationServices(overrides: Partial<ApplicationDependencies> = {}) {
	const dependencies: ApplicationDependencies = {
		courses: overrides.courses ?? new InMemoryCourseRepository(seedCourses),
		enrollmentRequests: overrides.enrollmentRequests ?? new InMemoryEnrollmentRequestRepository(),
		now: overrides.now ?? (() => '2026-06-27T10:00:00.000Z'),
		createId: overrides.createId ?? sequentialIds(),
	};
	return buildApplicationServicesFactory({ environment: 'test' }, dependencies);
}

function sequentialIds(): () => string {
	let next = 0;
	return () => {
		next += 1;
		return `enroll-${String(next).padStart(3, '0')}`;
	};
}

class InMemoryCourseRepository implements CourseRepository {
	private readonly courses: Course[];

	constructor(courses: readonly Course[]) {
		this.courses = structuredClone(courses) as Course[];
	}

	list(): Promise<readonly Course[]> {
		return Promise.resolve(structuredClone(this.courses));
	}

	getById(id: string): Promise<Course | undefined> {
		const course = this.courses.find((item) => item.id === id);
		return Promise.resolve(course === undefined ? undefined : structuredClone(course));
	}
}

class InMemoryEnrollmentRequestRepository implements EnrollmentRequestRepository {
	private readonly requests: EnrollmentRequest[] = [];

	list(): Promise<readonly EnrollmentRequest[]> {
		return Promise.resolve(structuredClone(this.requests));
	}

	getById(id: string): Promise<EnrollmentRequest | undefined> {
		const request = this.requests.find((item) => item.id === id);
		return Promise.resolve(request === undefined ? undefined : structuredClone(request));
	}

	add(request: EnrollmentRequest): Promise<void> {
		this.requests.push(structuredClone(request));
		return Promise.resolve();
	}

	save(request: EnrollmentRequest): Promise<void> {
		const index = this.requests.findIndex((item) => item.id === request.id);
		if (index === -1) {
			throw new Error(`Enrollment request ${request.id} does not exist.`);
		}
		this.requests[index] = structuredClone(request);
		return Promise.resolve();
	}
}
