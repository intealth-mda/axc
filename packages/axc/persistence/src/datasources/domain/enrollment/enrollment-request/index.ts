import type { EnrollmentRequestRecord } from '@axc/data-sources-mongoose-models';
import { EnrollmentRequestUnitOfWorkImpl } from './enrollment-request.uow.ts';
export const EnrollmentRequestPersistence = (records: Map<string, EnrollmentRequestRecord>) => ({ EnrollmentRequestUnitOfWork: new EnrollmentRequestUnitOfWorkImpl(records) });
