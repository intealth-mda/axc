import type { Repository } from '@cellix/domain-seedwork/repository';
import type { Course, CourseProps } from './course.aggregate.ts';

export interface CourseRepository<props extends CourseProps> extends Repository<Course<props>> {
	getNewInstance(title: string, summary: string, modality: string, status: string, tags: string[]): Promise<Course<props>>;
	getById(id: string): Promise<Course<props>>;
}
