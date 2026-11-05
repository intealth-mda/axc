import type { EnrollmentRequestModelType } from '@axc/data-sources-mongoose-models';
import type { Domain } from '@axc/domain';
import { EnrollmentRequestConverter } from '../../../domain/catalog/enrollment-request/enrollment-request.domain-adapter.ts';
import type { FindOneOptions, FindOptions } from '../../mongo-data-source.ts';
import { type EnrollmentRequestDataSource, EnrollmentRequestDataSourceImpl } from './enrollment-request.data.ts';

export interface EnrollmentRequestReadRepository {
	getAll: (options?: FindOptions) => Promise<Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestEntityReference[]>;
	getById: (id: string, options?: FindOneOptions) => Promise<Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestEntityReference | null>;
	find: (status?: 'pending' | 'approved' | 'rejected' | 'cancelled', courseId?: string, learnerEmail?: string) => Promise<Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestEntityReference[]>;
	findById: (id?: string) => Promise<Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestEntityReference[]>;
}

class EnrollmentRequestReadRepositoryImpl implements EnrollmentRequestReadRepository {
	private readonly mongoDataSource: EnrollmentRequestDataSource;
	private readonly converter: EnrollmentRequestConverter;
	private readonly passport: Domain.Passport;

	constructor(models: { EnrollmentRequest: EnrollmentRequestModelType }, passport: Domain.Passport) {
		this.mongoDataSource = new EnrollmentRequestDataSourceImpl(models.EnrollmentRequest);
		this.converter = new EnrollmentRequestConverter();
		this.passport = passport;
	}

	async getAll(options?: FindOptions): Promise<Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestEntityReference[]> {
		const result = await this.mongoDataSource.find({}, options);
		return result.map((doc) => this.converter.toDomain(doc, this.passport));
	}

	async getById(id: string, options?: FindOneOptions): Promise<Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestEntityReference | null> {
		const result = await this.mongoDataSource.findById(id, options);
		if (!result) {
			return null;
		}
		return this.converter.toDomain(result, this.passport);
	}

	async find(status?: 'pending' | 'approved' | 'rejected' | 'cancelled', courseId?: string, learnerEmail?: string): Promise<Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestEntityReference[]> {
		const filter: { status?: 'pending' | 'approved' | 'rejected' | 'cancelled'; courseId?: string; learnerEmail?: string } = {};
		if (status !== undefined) {
			filter.status = status;
		}
		if (courseId !== undefined) {
			filter.courseId = courseId;
		}
		if (learnerEmail !== undefined) {
			filter.learnerEmail = learnerEmail;
		}
		const result = await this.mongoDataSource.find(filter);
		return result.map((doc) => this.converter.toDomain(doc, this.passport));
	}

	async findById(id?: string): Promise<Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestEntityReference[]> {
		if (id === undefined || id === '') {
			throw Object.assign(new Error('Enrollment request does not exist.'), { status: 404, code: 'ENROLLMENT_REQUEST_NOT_FOUND', field: 'id' });
		}
		const found = await this.getById(id);
		if (!found) {
			throw Object.assign(new Error('Enrollment request does not exist.'), { status: 404, code: 'ENROLLMENT_REQUEST_NOT_FOUND', field: 'id' });
		}
		return [found];
	}
}

export const getEnrollmentRequestReadRepository = (models: { EnrollmentRequest: EnrollmentRequestModelType }, passport: Domain.Passport): EnrollmentRequestReadRepository => {
	return new EnrollmentRequestReadRepositoryImpl(models, passport);
};
