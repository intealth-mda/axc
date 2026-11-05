import type { CourseModelType } from '@axc/data-sources-mongoose-models';
import type { Domain } from '@axc/domain';
import { CourseConverter } from '../../../domain/catalog/course/course.domain-adapter.ts';
import type { FindOneOptions, FindOptions } from '../../mongo-data-source.ts';
import { type CourseDataSource, CourseDataSourceImpl } from './course.data.ts';

export interface CourseReadRepository {
	getAll: (options?: FindOptions) => Promise<Domain.Contexts.Catalog.Course.CourseEntityReference[]>;
	getById: (id: string, options?: FindOneOptions) => Promise<Domain.Contexts.Catalog.Course.CourseEntityReference | null>;
	search: (
		q?: string,
		modality?: 'online' | 'in-person' | 'hybrid',
		status?: 'draft' | 'active' | 'retired',
		tag?: string,
		page?: number,
		pageSize?: number,
		sort?: 'title' | 'createdAt' | 'updatedAt',
	) => Promise<Domain.Contexts.Catalog.Course.CourseEntityReference[]>;
}

class CourseReadRepositoryImpl implements CourseReadRepository {
	private readonly mongoDataSource: CourseDataSource;
	private readonly converter: CourseConverter;
	private readonly passport: Domain.Passport;

	constructor(models: { Course: CourseModelType }, passport: Domain.Passport) {
		this.mongoDataSource = new CourseDataSourceImpl(models.Course);
		this.converter = new CourseConverter();
		this.passport = passport;
	}

	async getAll(options?: FindOptions): Promise<Domain.Contexts.Catalog.Course.CourseEntityReference[]> {
		const result = await this.mongoDataSource.find({}, options);
		return result.map((doc) => this.converter.toDomain(doc, this.passport));
	}

	async getById(id: string, options?: FindOneOptions): Promise<Domain.Contexts.Catalog.Course.CourseEntityReference | null> {
		const result = await this.mongoDataSource.findById(id, options);
		if (!result) {
			return null;
		}
		return this.converter.toDomain(result, this.passport);
	}

	async search(
		q?: string,
		modality?: 'online' | 'in-person' | 'hybrid',
		status?: 'draft' | 'active' | 'retired',
		tag?: string,
		page?: number,
		pageSize?: number,
		sort?: 'title' | 'createdAt' | 'updatedAt',
	): Promise<Domain.Contexts.Catalog.Course.CourseEntityReference[]> {
		const requestedPage = page ?? 1;
		const requestedPageSize = pageSize ?? 10;
		if (!Number.isInteger(requestedPage) || requestedPage < 1) {
			throw Object.assign(new Error('page must be an integer greater than or equal to 1.'), { status: 400 });
		}
		if (!Number.isInteger(requestedPageSize) || requestedPageSize < 1 || requestedPageSize > 50) {
			throw Object.assign(new Error('pageSize must be between 1 and 50.'), { status: 400 });
		}
		const keyword = q === undefined ? '' : q.trim().toLowerCase();
		const tagQuery = tag === undefined ? '' : tag.trim().toLowerCase();
		const courses = await this.getAll();
		const matched = courses.filter((course) => {
			if (modality !== undefined && course.modality !== modality) {
				return false;
			}
			if (status !== undefined && course.status !== status) {
				return false;
			}
			if (tagQuery !== '' && !course.tags.some((item) => item.toLowerCase() === tagQuery)) {
				return false;
			}
			if (keyword !== '') {
				const inTitle = course.title.toLowerCase().includes(keyword);
				const inSummary = course.summary.toLowerCase().includes(keyword);
				const inTags = course.tags.some((item) => item.toLowerCase().includes(keyword));
				if (!inTitle && !inSummary && !inTags) {
					return false;
				}
			}
			return true;
		});
		const sortField = sort ?? 'title';
		matched.sort((left, right) => {
			if (sortField === 'createdAt') {
				return left.createdAt.getTime() - right.createdAt.getTime();
			}
			if (sortField === 'updatedAt') {
				return left.updatedAt.getTime() - right.updatedAt.getTime();
			}
			return left.title.localeCompare(right.title);
		});
		return matched;
	}
}

export const getCourseReadRepository = (models: { Course: CourseModelType }, passport: Domain.Passport): CourseReadRepository => {
	return new CourseReadRepositoryImpl(models, passport);
};
