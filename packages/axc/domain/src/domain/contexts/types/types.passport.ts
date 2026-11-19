import type { CourseEntityReference } from './course/course.aggregate.ts';
import type { EnrollmentRequestEntityReference } from './enrollment-request/enrollment-request.aggregate.ts';
import type { TypesVisa } from './types.visa.ts';

export interface TypesPassport {
	forCourse(root: CourseEntityReference): TypesVisa;
	forEnrollmentRequest(root: EnrollmentRequestEntityReference): TypesVisa;
}
