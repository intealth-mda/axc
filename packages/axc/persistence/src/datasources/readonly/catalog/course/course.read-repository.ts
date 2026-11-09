import type { CourseModelType } from '@axc/data-sources-mongoose-models';
import type { Domain } from '@axc/domain';
import { CourseConverter } from '../../../domain/catalog/course/course.domain-adapter.ts';
import type { FindOneOptions, FindOptions } from '../../mongo-data-source.ts';
import { type CourseDataSource, CourseDataSourceImpl } from './course.data.ts';

export interface CourseReadRepository {
	getAll: (options?: FindOptions) => Promise<Domain.Contexts.Catalog.Course.CourseEntityReference[]>;
	getById: (id: string, options?: FindOneOptions) => Promise<Domain.Contexts.Catalog.Course.CourseEntityReference | null>;
	searchCourses: (
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

	async searchCourses(
		q?: string,
		modality?: 'online' | 'in-person' | 'hybrid',
		status?: 'draft' | 'active' | 'retired',
		tag?: string,
		page?: number,
		pageSize?: number,
		sort?: 'title' | 'createdAt' | 'updatedAt',
	): Promise<Domain.Contexts.Catalog.Course.CourseEntityReference[]> {
		void page;
		void pageSize;
		const courses = await this.getAll();
		const keyword = q?.toLowerCase();
		const tagFilter = tag?.toLowerCase();
		const matches = courses.filter((course) => {
			if (modality !== undefined && course.modality !== modality) return false;
			if (status !== undefined && course.status !== status) return false;
			if (tagFilter !== undefined && !course.tags.some((entry) => entry.toLowerCase() === tagFilter)) return false;
			if (keyword !== undefined && keyword !== '') {
				const inTitle = course.title.toLowerCase().includes(keyword);
				const inSummary = course.summary.toLowerCase().includes(keyword);
				const inTags = course.tags.some((entry) => entry.toLowerCase().includes(keyword));
				if (!inTitle && !inSummary && !inTags) return false;
			}
			return true;
		});
		const sortKey = sort ?? 'title';
		matches.sort((left, right) => {
			if (sortKey === 'title') return left.title.localeCompare(right.title);
			return left[sortKey].getTime() - right[sortKey].getTime();
		});
		return matches;
	}
}

export const getCourseReadRepository = (models: { Course: CourseModelType }, passport: Domain.Passport): CourseReadRepository => {
	return new CourseReadRepositoryImpl(models, passport);
};
