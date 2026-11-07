import type { Mongoose } from 'mongoose';
import { createCourseModel } from './models/catalog/course.model.ts';
import { createEnrollmentRequestModel } from './models/enrollment/enrollment-request.model.ts';

export * from './models/catalog/course.model.ts';
export * from './models/enrollment/enrollment-request.model.ts';
export const mongooseContextBuilder = (connection: Mongoose) => ({ Course: createCourseModel(connection), EnrollmentRequest: createEnrollmentRequestModel(connection) });
