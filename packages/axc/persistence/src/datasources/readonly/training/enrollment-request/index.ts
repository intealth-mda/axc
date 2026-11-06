import type { MemoryStore } from '../../../store.ts';
import { type EnrollmentRequestReadRepository, getEnrollmentRequestReadRepository } from './enrollment-request.read-repository.ts';
export const EnrollmentRequestDataSource = (store: MemoryStore): { EnrollmentRequestReadRepo: EnrollmentRequestReadRepository } => ({ EnrollmentRequestReadRepo: getEnrollmentRequestReadRepository(store) });
