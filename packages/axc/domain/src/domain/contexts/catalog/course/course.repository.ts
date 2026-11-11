import type { Repository } from '@cellix/domain-seedwork/repository';
import type { Course, CourseProps } from './course.aggregate.ts';

export interface CourseRepository extends Repository<Course> {
	getNewInstance(id: string, input: Omit<CourseProps, 'id' | 'createdAt' | 'updatedAt'>, now: string): Promise<Course>;
	getById(id: string): Promise<Course>;
	getAll(): Promise<Course[]>;
}
