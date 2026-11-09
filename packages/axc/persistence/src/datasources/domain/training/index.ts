import type { MemoryStore } from '../../store.ts';
import { EnrollmentRequestPersistence } from './enrollment-request/index.ts';
export const TrainingContext = (store: MemoryStore) => ({ EnrollmentRequest: EnrollmentRequestPersistence(store) });
