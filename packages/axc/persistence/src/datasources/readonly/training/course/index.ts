import type { MemoryStore } from '../../../store.ts';
import { type CourseReadRepository, getCourseReadRepository } from './course.read-repository.ts';
export const CourseDataSource = (store: MemoryStore): { CourseReadRepo: CourseReadRepository } => ({ CourseReadRepo: getCourseReadRepository(store) });
