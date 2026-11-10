import type { Course } from './course.aggregate.ts';
import { COURSE_PAGE_SIZE_MAX, type CourseSearchCriteria, type CourseSearchPage, type CourseSortField } from './course.repository.ts';

export function searchCourseCatalog(courses: readonly Course[], criteria: CourseSearchCriteria): CourseSearchPage {
	if (criteria.page < 1 || criteria.pageSize < 1 || criteria.pageSize > COURSE_PAGE_SIZE_MAX) {
		throw new Error('Course search criteria are out of range.');
	}

	const filtered = courses.filter((course) => matchesCourse(course, criteria));
	const sorted = [...filtered].sort((left, right) => compareCourses(left, right, criteria.sort));
	const totalItems = sorted.length;
	const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / criteria.pageSize);
	const start = (criteria.page - 1) * criteria.pageSize;
	const items = sorted.slice(start, start + criteria.pageSize);

	return {
		items,
		page: criteria.page,
		pageSize: criteria.pageSize,
		totalItems,
		totalPages,
	};
}

function matchesCourse(course: Course, criteria: CourseSearchCriteria): boolean {
	if (criteria.modality !== undefined && course.props.modality !== criteria.modality) {
		return false;
	}
	if (criteria.status !== undefined && course.props.status !== criteria.status) {
		return false;
	}
	if (criteria.tag !== undefined && criteria.tag.length > 0 && !hasTag(course.props.tags, criteria.tag)) {
		return false;
	}
	if (criteria.q !== undefined && criteria.q.length > 0 && !matchesKeyword(course, criteria.q)) {
		return false;
	}
	return true;
}

function hasTag(tags: readonly string[], tag: string): boolean {
	const needle = tag.toLocaleLowerCase('en-US');
	return tags.some((item) => item.toLocaleLowerCase('en-US') === needle);
}

function matchesKeyword(course: Course, keyword: string): boolean {
	const needle = keyword.toLocaleLowerCase('en-US');
	if (course.props.title.toLocaleLowerCase('en-US').includes(needle)) {
		return true;
	}
	if (course.props.summary.toLocaleLowerCase('en-US').includes(needle)) {
		return true;
	}
	return course.props.tags.some((tag) => tag.toLocaleLowerCase('en-US').includes(needle));
}

function compareCourses(left: Course, right: Course, sort: CourseSortField): number {
	const leftValue = left.props[sort];
	const rightValue = right.props[sort];
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
