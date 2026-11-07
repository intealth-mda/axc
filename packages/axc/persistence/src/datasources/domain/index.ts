import type { EnrollmentRequestRecord } from '@axc/data-sources-mongoose-models';
import { Enrollment } from './enrollment/index.ts';
export const domainDataSource = (records: Map<string, EnrollmentRequestRecord>) => ({ Enrollment: Enrollment(records) });
