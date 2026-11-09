import type { EnrollmentRequestRecord } from '@axc/data-sources-mongoose-models';
import { EnrollmentRequest, type EnrollmentRequestProps, type StatusHistoryEntry } from '@axc/domain';

class EnrollmentRequestDomainAdapter implements EnrollmentRequestProps {
	private readonly record: EnrollmentRequestRecord;
	constructor(record: EnrollmentRequestRecord) {
		this.record = structuredClone(record);
	}
	get id(): string {
		return this.record.id;
	}
	get courseId(): string {
		return this.record.courseId;
	}
	set courseId(value: string) {
		this.record.courseId = value;
	}
	get learnerEmail(): string {
		return this.record.learnerEmail;
	}
	set learnerEmail(value: string) {
		this.record.learnerEmail = value;
	}
	get justification(): string {
		return this.record.justification;
	}
	set justification(value: string) {
		this.record.justification = value;
	}
	get status(): string {
		return this.record.status;
	}
	set status(value: string) {
		this.record.status = value;
	}
	get createdAt(): string {
		return this.record.createdAt;
	}
	set createdAt(value: string) {
		this.record.createdAt = value;
	}
	get updatedAt(): string {
		return this.record.updatedAt;
	}
	set updatedAt(value: string) {
		this.record.updatedAt = value;
	}
	get statusHistory(): StatusHistoryEntry[] {
		return structuredClone(this.record.statusHistory);
	}
	set statusHistory(value: StatusHistoryEntry[]) {
		this.record.statusHistory = structuredClone(value);
	}
}
export class EnrollmentRequestConverter {
	toAdapter(record: EnrollmentRequestRecord): EnrollmentRequestDomainAdapter {
		return new EnrollmentRequestDomainAdapter(record);
	}
	toDomain(record: EnrollmentRequestRecord): EnrollmentRequest {
		return new EnrollmentRequest(this.toAdapter(record), undefined);
	}
	toRecord(aggregate: EnrollmentRequest): EnrollmentRequestRecord {
		return {
			id: aggregate.id,
			courseId: aggregate.courseId,
			learnerEmail: aggregate.learnerEmail,
			justification: aggregate.justification,
			status: aggregate.status,
			createdAt: aggregate.createdAt,
			updatedAt: aggregate.updatedAt,
			statusHistory: aggregate.statusHistory.map((entry) => ({ ...entry })),
		};
	}
}
