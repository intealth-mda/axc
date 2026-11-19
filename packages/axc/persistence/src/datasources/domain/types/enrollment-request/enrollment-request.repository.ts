import { Domain, type EnrollmentRequest as EnrollmentRequestAggregate, type EnrollmentRequestRepository as EnrollmentRequestRepositoryContract, type Passport } from '@axc/domain';
import type { EnrollmentRequest as EnrollmentRequestDocument } from '@axc/service-mongoose';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { EnrollmentRequestDomainAdapter } from './enrollment-request.domain-adapter.ts';

type EnrollmentRequestModel = EnrollmentRequestAggregate<EnrollmentRequestDomainAdapter>;

export class EnrollmentRequestRepository
	extends MongooseSeedwork.MongoRepositoryBase<EnrollmentRequestDocument, EnrollmentRequestDomainAdapter, Passport, EnrollmentRequestModel>
	implements EnrollmentRequestRepositoryContract<EnrollmentRequestDomainAdapter>
{
	async getById(id: string): Promise<EnrollmentRequestModel> {
		const document = await this.model.findById(id).exec();
		if (!document) {
			throw new Error(`EnrollmentRequest with id ${id} not found`);
		}
		return this.typeConverter.toDomain(document, this.passport);
	}

	getNewInstance(courseId: string, learnerEmail: string, justification: string, status: string): Promise<EnrollmentRequestModel> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(Domain.Contexts.Types.EnrollmentRequest.EnrollmentRequest.getNewInstance(adapter, courseId, learnerEmail, justification, status, this.passport));
	}
}
