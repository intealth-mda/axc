import type { CourseRecord, EnrollmentRequestRecord } from '@axc/data-sources-mongoose-models';
export interface MemoryStore {
	courses: Map<string, CourseRecord>;
	enrollments: Map<string, EnrollmentRequestRecord>;
	tail: Promise<void>;
}
