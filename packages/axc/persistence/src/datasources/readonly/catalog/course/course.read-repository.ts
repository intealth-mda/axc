import type { CourseModelType } from '@axc/data-sources-mongoose-models';
import type { Domain } from '@axc/domain';
import { CourseConverter } from '../../../domain/catalog/course/course.domain-adapter.ts';
import type { FindOneOptions, FindOptions } from '../../mongo-data-source.ts';
import { type CourseDataSource, CourseDataSourceImpl } from './course.data.ts';

export interface CourseReadRepository {
	getAll: (options?: FindOptions) => Promise<Domain.Contexts.Catalog.Course.CourseEntityReference[]>;
	getById: (id: string, options?: FindOneOptions) => Promise<Domain.Contexts.Catalog.Course.CourseEntityReference | null>;
	searchCourses: (command: {
		q?: string;
		modality?: 'online' | 'in-person' | 'hybrid';
		status?: 'draft' | 'active' | 'retired';
		tag?: string;
		page?: number;
		pageSize?: number;
		sort?: 'title' | 'createdAt' | 'updatedAt';
	}) => Promise<Domain.Contexts.Catalog.Course.CourseEntityReference[]>;
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

	async searchCourses(command: {
		q?: string;
		modality?: 'online' | 'in-person' | 'hybrid';
		status?: 'draft' | 'active' | 'retired';
		tag?: string;
		page?: number;
		pageSize?: number;
		sort?: 'title' | 'createdAt' | 'updatedAt';
	}): Promise<Domain.Contexts.Catalog.Course.CourseEntityReference[]> {
		const filter = {
			...(command.modality === undefined ? {} : { modality: command.modality }),
			...(command.status === undefined ? {} : { status: command.status }),
		};
		const keyword = command.q?.toLowerCase();
		const tag = command.tag?.toLowerCase();
		const result = await this.mongoDataSource.find(filter);
		const matches = result
			.map((doc) => this.converter.toDomain(doc, this.passport))
			.filter((course) => {
				const tagMatches = tag === undefined || course.tags.some((courseTag) => courseTag.toLowerCase() === tag);
				const keywordMatches = keyword === undefined || [course.title, course.summary, ...course.tags].join('\n').toLowerCase().includes(keyword);
				return tagMatches && keywordMatches;
			});
		const sort = command.sort ?? 'title';
		return matches.sort((left, right) => {
			if (sort === 'createdAt') {
				return left.createdAt.getTime() - right.createdAt.getTime();
			}
			if (sort === 'updatedAt') {
				return left.updatedAt.getTime() - right.updatedAt.getTime();
			}
			return left.title.localeCompare(right.title);
		});
	}
}

export const getCourseReadRepository = (models: { Course: CourseModelType }, passport: Domain.Passport): CourseReadRepository => {
	return new CourseReadRepositoryImpl(models, passport);
};
