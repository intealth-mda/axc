import type { EnrollmentRequestRecord } from '@axc/data-sources-mongoose-models';
import { EnrollmentRequest, type EnrollmentRequestProps } from '@axc/domain';
import type { TypeConverter } from '@cellix/domain-seedwork/type-converter';

class EnrollmentRequestDomainAdapter implements EnrollmentRequestProps {
	private readonly doc: EnrollmentRequestRecord;
	constructor(doc: EnrollmentRequestRecord) {
		this.doc = doc;
	}
	get id() {
		return this.doc.id;
	}
	get courseId() {
		return this.doc.courseId;
	}
	set courseId(value: EnrollmentRequestProps['courseId']) {
		this.doc.courseId = value;
	}
	get learnerEmail() {
		return this.doc.learnerEmail;
	}
	set learnerEmail(value: EnrollmentRequestProps['learnerEmail']) {
		this.doc.learnerEmail = value;
	}
	get justification() {
		return this.doc.justification;
	}
	set justification(value: EnrollmentRequestProps['justification']) {
		this.doc.justification = value;
	}
	get status() {
		return this.doc.status;
	}
	set status(value: EnrollmentRequestProps['status']) {
		this.doc.status = value;
	}
	get createdAt() {
		return this.doc.createdAt;
	}
	set createdAt(value: EnrollmentRequestProps['createdAt']) {
		this.doc.createdAt = value;
	}
	get updatedAt() {
		return this.doc.updatedAt;
	}
	set updatedAt(value: EnrollmentRequestProps['updatedAt']) {
		this.doc.updatedAt = value;
	}
	get statusHistory() {
		return this.doc.statusHistory;
	}
	set statusHistory(value: EnrollmentRequestProps['statusHistory']) {
		this.doc.statusHistory = value;
	}
}
export class EnrollmentRequestConverter implements TypeConverter<EnrollmentRequestRecord, EnrollmentRequestProps, undefined, EnrollmentRequest> {
	toAdapter(record: EnrollmentRequestRecord | EnrollmentRequest): EnrollmentRequestProps {
		return new EnrollmentRequestDomainAdapter(this.toRecord(record));
	}
	private toRecord(record: EnrollmentRequestRecord | EnrollmentRequest): EnrollmentRequestRecord {
		return {
			id: record.id,
			courseId: record.courseId,
			learnerEmail: record.learnerEmail,
			justification: record.justification,
			status: record.status,
			createdAt: record.createdAt,
			updatedAt: record.updatedAt,
			statusHistory: record.statusHistory.map((entry) => ({ ...entry })),
		};
	}
	toDomain(record: EnrollmentRequestRecord): EnrollmentRequest {
		return new EnrollmentRequest(this.toAdapter(record), undefined);
	}
	toPersistence(aggregate: EnrollmentRequest): EnrollmentRequestRecord {
		return this.toRecord(aggregate);
	}
}
