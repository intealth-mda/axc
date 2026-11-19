import { type Course, type CourseRepository as CourseRepositoryContract, Domain, type Passport } from '@axc/domain';
import type { Course as CourseDocument } from '@axc/service-mongoose';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { CourseDomainAdapter } from './course.domain-adapter.ts';

type CourseAggregate = Course<CourseDomainAdapter>;

export class CourseRepository extends MongooseSeedwork.MongoRepositoryBase<CourseDocument, CourseDomainAdapter, Passport, CourseAggregate> implements CourseRepositoryContract<CourseDomainAdapter> {
	async getById(id: string): Promise<CourseAggregate> {
		const document = await this.model.findById(id).exec();
		if (!document) {
			throw new Error(`Course with id ${id} not found`);
		}
		return this.typeConverter.toDomain(document, this.passport);
	}

	getNewInstance(title: string, summary: string, modality: string, status: string, tags: string[]): Promise<CourseAggregate> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(Domain.Contexts.Types.Course.Course.getNewInstance(adapter, title, summary, modality, status, tags, this.passport));
	}
}
