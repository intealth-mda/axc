import type { Course } from './course.aggregate.ts';
import type { CourseSearchCriteria, CourseSearchPage } from './course.repository.ts';
import type { CourseSort } from './course.value-objects.ts';

function fieldValue(course: Course, sort: CourseSort): string {
	if (sort === 'title') {
		return course.title;
	}
	if (sort === 'createdAt') {
		return course.createdAt;
	}
	return course.updatedAt;
}

function compareCourses(sort: CourseSort, left: Course, right: Course): number {
	const leftValue = fieldValue(left, sort);
	const rightValue = fieldValue(right, sort);
	if (leftValue < rightValue) {
		return -1;
	}
	if (leftValue > rightValue) {
		return 1;
	}
	if (left.id < right.id) {
		return -1;
	}
	if (left.id > right.id) {
		return 1;
	}
	return 0;
}

function matchesKeyword(course: Course, keyword: string): boolean {
	const needle = keyword.toLowerCase();
	if (course.title.toLowerCase().includes(needle)) {
		return true;
	}
	if (course.summary.toLowerCase().includes(needle)) {
		return true;
	}
	return course.tags.some((tag) => tag.toLowerCase().includes(needle));
}

function matchesCriteria(course: Course, criteria: CourseSearchCriteria): boolean {
	if (criteria.modality !== undefined && course.modality !== criteria.modality) {
		return false;
	}
	if (criteria.status !== undefined && course.status !== criteria.status) {
		return false;
	}
	const tag = criteria.tag;
	if (tag !== undefined) {
		const needle = tag.toLowerCase();
		if (!course.tags.some((item) => item.toLowerCase() === needle)) {
			return false;
		}
	}
	const keyword = criteria.q;
	if (keyword !== undefined && !matchesKeyword(course, keyword)) {
		return false;
	}
	return true;
}

export function searchCourses(courses: readonly Course[], criteria: CourseSearchCriteria): CourseSearchPage {
	const filtered = courses.filter((course) => matchesCriteria(course, criteria));
	const sorted = [...filtered].sort((left, right) => compareCourses(criteria.sort, left, right));
	const totalItems = sorted.length;
	const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / criteria.pageSize);
	const start = (criteria.page - 1) * criteria.pageSize;
	return {
		items: sorted.slice(start, start + criteria.pageSize),
		page: criteria.page,
		pageSize: criteria.pageSize,
		totalItems,
		totalPages,
	};
}
