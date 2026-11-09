import type { MemoryStore } from '../../store.ts';
import { CourseReadRepositoryImpl } from './course/index.ts';
import { EnrollmentRequestReadRepositoryImpl } from './enrollment-request/index.ts';
export const TrainingContext = (store: MemoryStore) => ({ Course: CourseReadRepositoryImpl(store), EnrollmentRequest: EnrollmentRequestReadRepositoryImpl(store) });
