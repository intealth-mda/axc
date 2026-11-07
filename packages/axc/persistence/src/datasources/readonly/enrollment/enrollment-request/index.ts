import type { EnrollmentRequestRecord } from '@axc/data-sources-mongoose-models';
import type { EnrollmentRequestReadRepository } from './enrollment-request.read-repository.ts';
import { EnrollmentRequestReadRepositoryImpl } from './enrollment-request.read-repository.ts';

export const EnrollmentRequest = (records: Map<string, EnrollmentRequestRecord>): { EnrollmentRequestReadRepo: EnrollmentRequestReadRepository } => ({ EnrollmentRequestReadRepo: EnrollmentRequestReadRepositoryImpl(records) });
