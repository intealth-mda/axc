import type { Mongoose } from 'mongoose';
import { CourseModelFactory } from './models/catalog/course.model.ts';

export { CourseModelFactory, CourseModelName, type CourseModelType, type CourseRecord, CourseSchema } from './models/catalog/course.model.ts';
export const mongooseContextBuilder = (service: Mongoose) => ({ Catalog: { Course: CourseModelFactory(service) } });
