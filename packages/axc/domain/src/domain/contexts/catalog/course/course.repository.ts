import type * as DomainSeedwork from '@cellix/domain-seedwork/repository';
import type { Course } from './course.aggregate.ts';

export interface CourseRepository extends DomainSeedwork.Repository<Course> {
	list(): Promise<readonly Course[]>;
}
