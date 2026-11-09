import { randomUUID } from 'node:crypto';
import type { EnrollmentRequestRecord } from '@axc/data-sources-mongoose-models';
import { EnrollmentRequest, type EnrollmentRequestRepository as RepositoryContract, WorkflowError } from '@axc/domain';
import type { EnrollmentRequestConverter } from './enrollment-request.domain-adapter.ts';
export class EnrollmentRequestRepository implements RepositoryContract {
	private readonly records: Map<string, EnrollmentRequestRecord>;
	private readonly converter: EnrollmentRequestConverter;
	constructor(records: Map<string, EnrollmentRequestRecord>, converter: EnrollmentRequestConverter) {
		this.records = records;
		this.converter = converter;
	}
	async getNewInstance(courseId: string, learnerEmail: string, justification: string): Promise<EnrollmentRequest> {
		const adapter = this.converter.toAdapter({ id: `enroll-${randomUUID()}`, courseId: '', learnerEmail: '', justification: '', status: '', createdAt: '', updatedAt: '', statusHistory: [] });
		return await Promise.resolve(EnrollmentRequest.getNewInstance(adapter, courseId, learnerEmail, justification, new Date().toISOString()));
	}
	get(id: string): Promise<EnrollmentRequest> {
		return this.getById(id);
	}
	async getById(id: string): Promise<EnrollmentRequest> {
		const record = this.records.get(id);
		if (!record) throw new WorkflowError('ENROLLMENT_REQUEST_NOT_FOUND', 'Enrollment request not found.');
		return await Promise.resolve(this.converter.toDomain(record));
	}
	async save(item: EnrollmentRequest): Promise<EnrollmentRequest> {
		if (
			['pending', 'approved'].includes(item.status) &&
			[...this.records.values()].some((row) => row.id !== item.id && row.courseId === item.courseId && row.learnerEmail === item.learnerEmail && ['pending', 'approved'].includes(row.status))
		)
			throw new WorkflowError('DUPLICATE_ACTIVE_REQUEST', 'An active request already exists for this learner and course.');
		this.records.set(item.id, this.converter.toRecord(item));
		return await Promise.resolve(this.converter.toDomain(this.converter.toRecord(item)));
	}
}
