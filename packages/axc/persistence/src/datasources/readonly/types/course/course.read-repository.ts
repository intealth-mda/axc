import type { CourseEntityReference, Passport } from '@axc/domain';
import type { CourseModelType } from '@axc/service-mongoose';
import { CourseConverter } from '../../../domain/types/course/course.domain-adapter.ts';
import type { FindOneOptions, FindOptions } from '../../mongo-data-source.ts';
import { type CourseDataSource, CourseDataSourceImpl } from './course.data.ts';

export interface CourseReadRepository {
	getAll: (options?: FindOptions) => Promise<CourseEntityReference[]>;
	getById: (id: string, options?: FindOneOptions) => Promise<CourseEntityReference | null>;
}

class CourseReadRepositoryImpl implements CourseReadRepository {
	private readonly mongoDataSource: CourseDataSource;
	private readonly converter: CourseConverter;
	private readonly passport: Passport;

	constructor(models: { Course: CourseModelType }, passport: Passport) {
		this.mongoDataSource = new CourseDataSourceImpl(models.Course);
		this.converter = new CourseConverter();
		this.passport = passport;
	}

	async getAll(options?: FindOptions): Promise<CourseEntityReference[]> {
		const result = options === undefined ? await this.mongoDataSource.find({}) : await this.mongoDataSource.find({}, options);
		return result.map((doc) => this.converter.toDomain(doc, this.passport));
	}

	async getById(id: string, options?: FindOneOptions): Promise<CourseEntityReference | null> {
		const result = options === undefined ? await this.mongoDataSource.findById(id) : await this.mongoDataSource.findById(id, options);
		if (!result) {
			return null;
		}
		return this.converter.toDomain(result, this.passport);
	}
}

export const getCourseReadRepository = (models: { Course: CourseModelType }, passport: Passport): CourseReadRepository => {
	return new CourseReadRepositoryImpl(models, passport);
};
