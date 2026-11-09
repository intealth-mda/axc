import type { Connection } from 'mongoose';
import { CourseModelFactory } from './models/training/course.model.ts';
import { EnrollmentRequestModelFactory } from './models/training/enrollment-request.model.ts';

export * from './models/training/course.model.ts';
export * from './models/training/enrollment-request.model.ts';
export const mongooseContextBuilder = (connection: Connection) => ({ Course: CourseModelFactory(connection), EnrollmentRequest: EnrollmentRequestModelFactory(connection) });
