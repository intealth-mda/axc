import type { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { CourseModelFactory } from './models/training/course.model.ts';
import { EnrollmentRequestModelFactory } from './models/training/enrollment-request.model.ts';

export * from './models/training/course.model.ts';
export * from './models/training/enrollment-request.model.ts';
export const mongooseContextBuilder = (factory: MongooseSeedwork.MongooseContextFactory) => ({ Course: CourseModelFactory(factory), EnrollmentRequest: EnrollmentRequestModelFactory(factory) });
