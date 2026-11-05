import type { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { CourseModelFactory } from './models/course/course.model.ts';
import { EnrollmentRequestModelFactory } from './models/enrollment-request/enrollment-request.model.ts';

export type { Course, CourseModelType } from './models/course/course.model.ts';
export { CourseModelName } from './models/course/course.model.ts';
export type { EnrollmentRequest, EnrollmentRequestModelType, EnrollmentRequestStatusHistory } from './models/enrollment-request/enrollment-request.model.ts';
export { EnrollmentRequestModelName } from './models/enrollment-request/enrollment-request.model.ts';

export const mongooseContextBuilder = (initializedService: MongooseSeedwork.MongooseContextFactory) => {
	return {
		Course: CourseModelFactory(initializedService),
		EnrollmentRequest: EnrollmentRequestModelFactory(initializedService),
	};
};
export { courseSeed } from './models/course/course.seed.ts';
export { enrollmentRequestSeed } from './models/enrollment-request/enrollment-request.seed.ts';
