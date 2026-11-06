import type { MemoryStore } from '../../../store.ts';
import { getEnrollmentRequestUnitOfWork } from './enrollment-request.uow.ts';
export const EnrollmentRequestPersistence = (store: MemoryStore) => ({ EnrollmentRequestUnitOfWork: getEnrollmentRequestUnitOfWork(store) });
