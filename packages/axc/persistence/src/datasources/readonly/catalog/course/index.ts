import type { CourseRecord } from '@axc/data-sources-mongoose-models';
import type { CourseReadRepository } from './course.read-repository.ts';
import { CourseReadRepositoryImpl } from './course.read-repository.ts';

export const Course = (records: CourseRecord[]): { CourseReadRepo: CourseReadRepository } => ({ CourseReadRepo: CourseReadRepositoryImpl(records) });
