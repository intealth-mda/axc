import { Course, type CourseProps, type CourseRepository, EnrollmentRequest, type EnrollmentRequestRepository, type NewEnrollmentRequest } from '@axc/domain';
import { COURSE_SEED } from './course-seed.ts';
import { InMemoryRepository } from './in-memory-repository.ts';

export class InMemoryCourseRepository extends InMemoryRepository<Course> implements CourseRepository {
	constructor(seed: readonly CourseProps[] = COURSE_SEED) {
		super(seed.map((p) => Course.getNewInstance(p)));
	}
	getNewInstance(props: CourseProps): Course {
		return Course.getNewInstance(props);
	}
}

export class InMemoryEnrollmentRequestRepository extends InMemoryRepository<EnrollmentRequest> implements EnrollmentRequestRepository {
	getNewInstance(id: string, input: NewEnrollmentRequest, now: string): EnrollmentRequest {
		return EnrollmentRequest.getNewInstance(id, input, now);
	}
}
