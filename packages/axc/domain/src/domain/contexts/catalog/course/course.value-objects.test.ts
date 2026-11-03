import { expect, it } from 'vitest';
import { CourseModalities, CourseSortFields, CourseStatuses } from './course.value-objects.ts';

it('lists the allowed course values', () => {
	expect([Object.values(CourseModalities), Object.values(CourseStatuses), Object.values(CourseSortFields)]).toEqual([
		['online', 'in-person', 'hybrid'],
		['draft', 'active', 'retired'],
		['title', 'createdAt', 'updatedAt'],
	]);
});
