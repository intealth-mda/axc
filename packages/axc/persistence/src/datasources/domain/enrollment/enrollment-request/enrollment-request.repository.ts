import type { EnrollmentRequestRecord } from '@axc/data-sources-mongoose-models';
import { Enrollment } from '@axc/domain';
import type { EnrollmentRequestConverter } from './enrollment-request.domain-adapter.ts';
export class EnrollmentRequestRepositoryImpl implements Enrollment.EnrollmentRequestRepository {
	private readonly records: Map<string, EnrollmentRequestRecord>;
	private readonly converter: EnrollmentRequestConverter;
	constructor(records: Map<string, EnrollmentRequestRecord>, converter: EnrollmentRequestConverter) {
		this.records = records;
		this.converter = converter;
	}
	getNewInstance(props: Omit<Enrollment.EnrollmentRequestProps, 'status' | 'statusHistory' | 'updatedAt'>) {
		const adapter = this.converter.newAdapter(props);
		return Promise.resolve(Enrollment.EnrollmentRequest.getNewInstance(adapter.toProps()));
	}
	get(id: string) {
		const record = this.records.get(id);
		if (!record) throw new Error('ENROLLMENT_REQUEST_NOT_FOUND');
		return Promise.resolve(this.converter.toDomain(record));
	}
	save(item: Enrollment.EnrollmentRequest) {
		this.records.set(item.id, this.converter.toRecord(item));
		return Promise.resolve(item);
	}
}
