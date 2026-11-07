import type { EnrollmentRequestRecord } from '@axc/data-sources-mongoose-models';
import { Enrollment } from '@axc/domain';

class EnrollmentRequestDomainAdapter implements Enrollment.EnrollmentRequestProps {
	readonly doc: EnrollmentRequestRecord;
	constructor(doc: EnrollmentRequestRecord) {
		this.doc = doc;
	}
	get id() {
		return this.doc.id;
	}
	get courseId() {
		return this.doc.courseId;
	}
	set courseId(v: string) {
		this.doc.courseId = v;
	}
	get learnerEmail() {
		return this.doc.learnerEmail;
	}
	set learnerEmail(v: string) {
		this.doc.learnerEmail = v;
	}
	get justification() {
		return this.doc.justification;
	}
	set justification(v: string) {
		this.doc.justification = v;
	}
	get status() {
		return this.doc.status;
	}
	set status(v: Enrollment.EnrollmentStatus) {
		this.doc.status = v;
	}
	get createdAt() {
		return this.doc.createdAt;
	}
	get updatedAt() {
		return this.doc.updatedAt;
	}
	set updatedAt(v: string) {
		this.doc.updatedAt = v;
	}
	get statusHistory(): Enrollment.StatusHistoryEntry[] {
		return this.doc.statusHistory as Enrollment.StatusHistoryEntry[];
	}
	set statusHistory(v: Enrollment.StatusHistoryEntry[]) {
		this.doc.statusHistory = v.map((x) => ({ ...x }));
	}
	toProps(): Enrollment.EnrollmentRequestProps {
		return {
			id: this.id,
			courseId: this.courseId,
			learnerEmail: this.learnerEmail,
			justification: this.justification,
			status: this.status,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
			statusHistory: this.statusHistory.map((x) => ({ ...x })),
		};
	}
}
export class EnrollmentRequestConverter {
	toDomain(record: EnrollmentRequestRecord): Enrollment.EnrollmentRequest {
		return Enrollment.EnrollmentRequest.rehydrate(new EnrollmentRequestDomainAdapter(structuredClone(record)).toProps());
	}
	toRecord(entity: Enrollment.EnrollmentRequest): EnrollmentRequestRecord {
		return structuredClone(entity.toReference()) as EnrollmentRequestRecord;
	}
	newAdapter(props: Omit<Enrollment.EnrollmentRequestProps, 'status' | 'statusHistory' | 'updatedAt'>): EnrollmentRequestDomainAdapter {
		return new EnrollmentRequestDomainAdapter({ ...props, status: 'pending', updatedAt: props.createdAt, statusHistory: [] });
	}
}
