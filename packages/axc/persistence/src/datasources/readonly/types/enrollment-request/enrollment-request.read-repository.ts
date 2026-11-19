import type { EnrollmentRequestEntityReference, Passport } from '@axc/domain';
import type { EnrollmentRequestModelType } from '@axc/service-mongoose';
import { EnrollmentRequestConverter } from '../../../domain/types/enrollment-request/enrollment-request.domain-adapter.ts';
import type { FindOneOptions, FindOptions } from '../../mongo-data-source.ts';
import { type EnrollmentRequestDataSource, EnrollmentRequestDataSourceImpl } from './enrollment-request.data.ts';

export interface EnrollmentRequestReadRepository {
	getAll: (options?: FindOptions) => Promise<EnrollmentRequestEntityReference[]>;
	getById: (id: string, options?: FindOneOptions) => Promise<EnrollmentRequestEntityReference | null>;
}

class EnrollmentRequestReadRepositoryImpl implements EnrollmentRequestReadRepository {
	private readonly mongoDataSource: EnrollmentRequestDataSource;
	private readonly converter: EnrollmentRequestConverter;
	private readonly passport: Passport;

	constructor(models: { EnrollmentRequest: EnrollmentRequestModelType }, passport: Passport) {
		this.mongoDataSource = new EnrollmentRequestDataSourceImpl(models.EnrollmentRequest);
		this.converter = new EnrollmentRequestConverter();
		this.passport = passport;
	}

	async getAll(options?: FindOptions): Promise<EnrollmentRequestEntityReference[]> {
		const result = options === undefined ? await this.mongoDataSource.find({}) : await this.mongoDataSource.find({}, options);
		return result.map((doc) => this.converter.toDomain(doc, this.passport));
	}

	async getById(id: string, options?: FindOneOptions): Promise<EnrollmentRequestEntityReference | null> {
		const result = options === undefined ? await this.mongoDataSource.findById(id) : await this.mongoDataSource.findById(id, options);
		if (!result) {
			return null;
		}
		return this.converter.toDomain(result, this.passport);
	}
}

export const getEnrollmentRequestReadRepository = (models: { EnrollmentRequest: EnrollmentRequestModelType }, passport: Passport): EnrollmentRequestReadRepository => {
	return new EnrollmentRequestReadRepositoryImpl(models, passport);
};
