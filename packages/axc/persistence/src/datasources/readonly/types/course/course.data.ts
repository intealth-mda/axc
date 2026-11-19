import type { Course } from '@axc/service-mongoose';
import { type MongoDataSource, MongoDataSourceImpl } from '../../mongo-data-source.ts';

export interface CourseDataSource extends MongoDataSource<Course> {}

export class CourseDataSourceImpl extends MongoDataSourceImpl<Course> implements CourseDataSource {}
