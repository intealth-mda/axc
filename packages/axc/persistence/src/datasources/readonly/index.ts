import type { CourseRecord, EnrollmentRequestRecord } from '@axc/data-sources-mongoose-models';
import { Catalog } from './catalog/index.ts';
import { Enrollment } from './enrollment/index.ts';
export const readonlyDataSource = (courses: CourseRecord[], requests: Map<string, EnrollmentRequestRecord>) => ({ Catalog: Catalog(courses), Enrollment: Enrollment(requests) });
