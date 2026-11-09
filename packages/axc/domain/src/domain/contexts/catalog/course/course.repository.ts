import type { Repository } from '@cellix/domain-seedwork/repository';
import type { Course, CourseInput } from './course.aggregate.ts';

export interface CourseRepository extends Repository<Course> {
	getNewInstance(id: string, input: CourseInput, now: string): Course;
	getById(id: string): Promise<Course>;
	getAll(): Promise<Course[]>;
}
