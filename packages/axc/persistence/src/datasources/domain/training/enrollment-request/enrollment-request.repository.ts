import { randomUUID } from 'node:crypto';
import type { EnrollmentRequestRecord } from '@axc/data-sources-mongoose-models';
import { type CourseEntityReference, EnrollmentRequest, type EnrollmentRequestRepository as Repository, RuleError } from '@axc/domain';
import type { EnrollmentRequestConverter } from './enrollment-request.domain-adapter.ts';
export class EnrollmentRequestRepository implements Repository {
	private readonly records: Map<string, EnrollmentRequestRecord>;
	private readonly converter: EnrollmentRequestConverter;
	constructor(records: Map<string, EnrollmentRequestRecord>, converter: EnrollmentRequestConverter) {
		this.records = records;
		this.converter = converter;
	}

	async getNewInstance(course: CourseEntityReference, email: string, justification: string): Promise<EnrollmentRequest> {
		const props = this.converter.toAdapter({ id: `enroll-${randomUUID()}`, courseId: '', learnerEmail: '', justification: '', status: 'pending', createdAt: '', updatedAt: '', statusHistory: [] });
		return await Promise.resolve(EnrollmentRequest.getNewInstance(props, course, email, justification));
	}
	async get(id: string): Promise<EnrollmentRequest> {
		return await this.getById(id);
	}
	async getById(id: string): Promise<EnrollmentRequest> {
		const record = this.records.get(id);
		if (!record) throw new RuleError('ENROLLMENT_REQUEST_NOT_FOUND', 'Enrollment request not found.');
		return await Promise.resolve(this.converter.toDomain(record));
	}
	async save(item: EnrollmentRequest): Promise<EnrollmentRequest> {
		if (item.status === 'pending' || item.status === 'approved') {
			const duplicate = [...this.records.values()].some(
				(record) => record.id !== item.id && record.courseId === item.courseId && record.learnerEmail === item.learnerEmail && (record.status === 'pending' || record.status === 'approved'),
			);
			if (duplicate) throw new RuleError('DUPLICATE_ACTIVE_REQUEST', 'An active request already exists for this learner and course.');
		}
		const record = this.converter.toPersistence(item);
		this.records.set(record.id, record);
		return await Promise.resolve(this.converter.toDomain(record));
	}
}
