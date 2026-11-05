import type { EnrollmentRequest } from '@axc/data-sources-mongoose-models';
import { Domain } from '@axc/domain';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { EnrollmentRequestDomainAdapter } from './enrollment-request.domain-adapter.ts';

export class EnrollmentRequestRepository
	extends MongooseSeedwork.MongoRepositoryBase<EnrollmentRequest, EnrollmentRequestDomainAdapter, Domain.Passport, Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequest<EnrollmentRequestDomainAdapter>>
	implements Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestRepository<EnrollmentRequestDomainAdapter>
{
	async getById(id: string): Promise<Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequest<EnrollmentRequestDomainAdapter>> {
		const stored = await this.model.collection.findOne({ _id: id } as never);
		const document = stored === null ? await this.model.findById(id).exec() : this.model.hydrate(stored);
		if (!document) {
			throw new Error(`EnrollmentRequest with id ${id} not found`);
		}
		return this.typeConverter.toDomain(document, this.passport);
	}

	// biome-ignore lint:noRequireAwait
	async getNewInstance(
		courseId: string,
		learnerEmail: string,
		justification: string,
		status: 'pending' | 'approved' | 'rejected' | 'cancelled',
	): Promise<Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequest<EnrollmentRequestDomainAdapter>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequest.getNewInstance(adapter, courseId, learnerEmail, justification, status, this.passport));
	}
}
