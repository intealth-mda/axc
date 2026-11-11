import type { Repository } from '@cellix/domain-seedwork/repository';
import type { Course, CourseProps } from './course.aggregate.ts';

export interface CourseRepository extends Repository<Course> {
	getNewInstance(id: string, input: Omit<CourseProps, 'id' | 'createdAt' | 'updatedAt'>, now: string): Course;
	getById(id: string): Promise<Course | undefined>;
	getAll(): Promise<Course[]>;
}
