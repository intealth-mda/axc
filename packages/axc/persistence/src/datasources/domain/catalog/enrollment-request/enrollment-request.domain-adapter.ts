import type { EnrollmentRequest, EnrollmentRequestStatusHistory } from '@axc/data-sources-mongoose-models';
import { Domain } from '@axc/domain';
import type { PropArray } from '@cellix/domain-seedwork/prop-array';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';

export class EnrollmentRequestConverter extends MongooseSeedwork.MongoTypeConverter<
	EnrollmentRequest,
	EnrollmentRequestDomainAdapter,
	Domain.Passport,
	Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequest<EnrollmentRequestDomainAdapter>
> {
	constructor() {
		super(EnrollmentRequestDomainAdapter, Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequest);
	}
}

export class EnrollmentRequestDomainAdapter extends MongooseSeedwork.MongooseDomainAdapter<EnrollmentRequest> implements Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestProps {
	get courseId(): string {
		return this.doc.courseId;
	}
	set courseId(courseId: string) {
		this.doc.courseId = courseId;
	}
	get learnerEmail(): string {
		return this.doc.learnerEmail;
	}
	set learnerEmail(learnerEmail: string) {
		this.doc.learnerEmail = learnerEmail;
	}
	get justification(): string {
		return this.doc.justification;
	}
	set justification(justification: string) {
		this.doc.justification = justification;
	}
	get status(): 'pending' | 'approved' | 'rejected' | 'cancelled' {
		return this.doc.status;
	}
	set status(status: 'pending' | 'approved' | 'rejected' | 'cancelled') {
		this.doc.status = status;
	}
	get statusHistory(): PropArray<Domain.Contexts.Catalog.EnrollmentRequest.StatusHistoryProps> {
		return new MongooseSeedwork.MongoosePropArray(this.doc.statusHistory, StatusHistoryDomainAdapter);
	}
}

class StatusHistoryDomainAdapter implements Domain.Contexts.Catalog.EnrollmentRequest.StatusHistoryProps {
	public readonly doc: EnrollmentRequestStatusHistory;
	constructor(doc: EnrollmentRequestStatusHistory) {
		this.doc = doc;
	}

	get id(): string {
		return this.doc.id?.valueOf() as string;
	}
	get createdAt(): Date {
		return this.doc.createdAt as Date;
	}
	get updatedAt(): Date {
		return this.doc.updatedAt as Date;
	}
	get fromStatus(): string | null {
		return this.doc.fromStatus;
	}
	set fromStatus(fromStatus: string | null) {
		this.doc.fromStatus = fromStatus;
	}
	get toStatus(): string {
		return this.doc.toStatus;
	}
	set toStatus(toStatus: string) {
		this.doc.toStatus = toStatus;
	}
	get changedAt(): string {
		return this.doc.changedAt;
	}
	set changedAt(changedAt: string) {
		this.doc.changedAt = changedAt;
	}
	get changedBy(): string {
		return this.doc.changedBy;
	}
	set changedBy(changedBy: string) {
		this.doc.changedBy = changedBy;
	}
	get reason(): string | null {
		return this.doc.reason;
	}
	set reason(reason: string | null) {
		this.doc.reason = reason;
	}
}
