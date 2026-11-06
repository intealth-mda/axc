import type { Repository } from '@cellix/domain-seedwork/repository';
import type { Course, NewCourseInput } from './course.aggregate.ts';

export interface CourseRepository extends Repository<Course> {
	getNewInstance(id: string, input: NewCourseInput, now: string): Course;
	getById(id: string): Promise<Course>;
	getAll(): Promise<readonly Course[]>;
}
