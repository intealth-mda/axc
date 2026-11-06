import type { Repository } from '@cellix/domain-seedwork/repository';
import type { CourseEntityReference } from '../course/index.ts';
import type { EnrollmentRequest } from './enrollment-request.aggregate.ts';
export interface EnrollmentRequestRepository extends Repository<EnrollmentRequest> {
	getNewInstance(course: CourseEntityReference, email: string, justification: string): Promise<EnrollmentRequest>;
	getById(id: string): Promise<EnrollmentRequest>;
}
