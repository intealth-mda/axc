import { Course, type CourseDraft, type CourseRepository, type CourseSearchCriteria, type CourseSearchResult, type CourseSort } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';

const READ_PASSPORT = { read: true } as const;

function includesTerm(value: string, term: string): boolean {
	return value.toLocaleLowerCase('en').includes(term);
}

function compareText(left: string, right: string): number {
	const lowerLeft = left.toLocaleLowerCase('en');
	const lowerRight = right.toLocaleLowerCase('en');
	if (lowerLeft < lowerRight) {
		return -1;
	}
	if (lowerLeft > lowerRight) {
		return 1;
	}
	if (left < right) {
		return -1;
	}
	if (left > right) {
		return 1;
	}
	return 0;
}

function compareCourses(left: Course, right: Course, sort: CourseSort): number {
	const byId = compareText(left.id, right.id);
	if (sort === 'title') {
		const byTitle = compareText(left.title, right.title);
		return byTitle === 0 ? byId : byTitle;
	}
	if (sort === 'createdAt') {
		const byCreated = compareText(left.createdAt, right.createdAt);
		return byCreated === 0 ? byId : byCreated;
	}
	const byUpdated = compareText(left.updatedAt, right.updatedAt);
	return byUpdated === 0 ? byId : byUpdated;
}

function matches(course: Course, criteria: CourseSearchCriteria): boolean {
	if (criteria.modality !== undefined && course.modality !== criteria.modality) {
		return false;
	}
	if (criteria.status !== undefined && course.status !== criteria.status) {
		return false;
	}
	if (criteria.tag !== undefined) {
		const expected = criteria.tag.toLocaleLowerCase('en');
		const tagged = course.tags.some((tag: string) => tag.toLocaleLowerCase('en') === expected);
		if (!tagged) {
			return false;
		}
	}
	if (criteria.q !== undefined && criteria.q.length > 0) {
		const term = criteria.q.toLocaleLowerCase('en');
		const inTitle = includesTerm(course.title, term);
		const inSummary = includesTerm(course.summary, term);
		const inTags = course.tags.some((tag: string) => includesTerm(tag, term));
		if (!inTitle && !inSummary && !inTags) {
			return false;
		}
	}
	return true;
}

export function createCourseRepository(records: readonly CourseDraft[]): CourseRepository {
	const courses = records.map((record) => Course.getNewInstance(record, READ_PASSPORT));

	return {
		get(id: string): Promise<Course> {
			const found = courses.find((course) => course.id === id);
			if (found === undefined) {
				return Promise.reject(new NotFoundError(`Course ${id} not found`));
			}
			return Promise.resolve(found);
		},
		save(item: Course): Promise<Course> {
			return Promise.resolve(item);
		},
		search(criteria: CourseSearchCriteria): Promise<CourseSearchResult> {
			const filtered = courses.filter((course) => matches(course, criteria));
			const sorted = [...filtered].sort((left, right) => compareCourses(left, right, criteria.sort));
			const start = (criteria.page - 1) * criteria.pageSize;
			const items = sorted.slice(start, start + criteria.pageSize);
			return Promise.resolve({ items, totalItems: filtered.length });
		},
	};
}
