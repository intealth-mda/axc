import { Domain, type EnrollmentRequest as EnrollmentRequestAggregate, type EnrollmentRequestProps, type Passport, type StatusHistoryProps } from '@axc/domain';
import type { EnrollmentRequest as EnrollmentRequestDocument, StatusHistoryDoc } from '@axc/service-mongoose';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';

class StatusHistoryDomainAdapter implements StatusHistoryProps {
	readonly doc: StatusHistoryDoc;
	constructor(doc: StatusHistoryDoc) {
		this.doc = doc;
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

type EnrollmentRequestModel = EnrollmentRequestAggregate<EnrollmentRequestDomainAdapter>;

export class EnrollmentRequestDomainAdapter extends MongooseSeedwork.MongooseDomainAdapter<EnrollmentRequestDocument> implements EnrollmentRequestProps {
	get courseId(): string {
		return String(this.doc.courseId);
	}
	set courseId(courseId: string) {
		this.doc.courseId = courseId as unknown as EnrollmentRequestDocument['courseId'];
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

	get status(): string {
		return this.doc.status;
	}
	set status(status: string) {
		this.doc.status = status;
	}

	get statusHistory(): StatusHistoryProps[] {
		return this.doc.statusHistory.map((entry) => new StatusHistoryDomainAdapter(entry));
	}
	set statusHistory(entries: StatusHistoryProps[]) {
		this.doc.statusHistory = entries.map((entry) => ({
			fromStatus: entry.fromStatus,
			toStatus: entry.toStatus,
			changedAt: entry.changedAt,
			changedBy: entry.changedBy,
			reason: entry.reason,
		}));
	}
}

export class EnrollmentRequestConverter extends MongooseSeedwork.MongoTypeConverter<EnrollmentRequestDocument, EnrollmentRequestDomainAdapter, Passport, EnrollmentRequestModel> {
	constructor() {
		super(EnrollmentRequestDomainAdapter, Domain.Contexts.Types.EnrollmentRequest.EnrollmentRequest);
	}
}
