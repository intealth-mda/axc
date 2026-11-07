import type { EnrollmentRequestRecord } from '@axc/data-sources-mongoose-models';
import { EnrollmentRequestPersistence } from './enrollment-request/index.ts';
export const Enrollment = (records: Map<string, EnrollmentRequestRecord>) => ({ EnrollmentRequest: EnrollmentRequestPersistence(records) });
