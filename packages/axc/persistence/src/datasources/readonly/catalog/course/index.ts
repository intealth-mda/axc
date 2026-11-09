import type { CourseModelType } from '@axc/data-sources-mongoose-models';
import { type CourseReadRepository, getCourseReadRepository } from './course.read-repository.ts';
export const CourseReadRepositoryImpl = (model: CourseModelType): { CourseReadRepo: CourseReadRepository } => ({ CourseReadRepo: getCourseReadRepository(model) });
