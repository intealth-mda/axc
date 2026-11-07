import type { EnrollmentRequestRecord } from '@axc/data-sources-mongoose-models';
import { EnrollmentRequest } from './enrollment-request/index.ts';
export const Enrollment = (records: Map<string, EnrollmentRequestRecord>) => ({ EnrollmentRequest: EnrollmentRequest(records) });
