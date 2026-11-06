import type { MemoryStore } from '../../store.ts';
import { EnrollmentRequestPersistence } from './enrollment-request/index.ts';
export const TrainingDomainDataSource = (store: MemoryStore) => ({ EnrollmentRequest: EnrollmentRequestPersistence(store) });
