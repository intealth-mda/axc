import type { MemoryStore } from '../../store.ts';
import { CourseDataSource } from './course/index.ts';
import { EnrollmentRequestDataSource } from './enrollment-request/index.ts';
export const TrainingReadonlyDataSource = (store: MemoryStore) => ({ Course: CourseDataSource(store), EnrollmentRequest: EnrollmentRequestDataSource(store) });
