import { Course, type CourseRecord, type CourseRepository, type CourseSearchCriteria, type CourseSortField, catalogReadVisa, systemCatalogPassport } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { courseFixtures } from './course-fixtures.ts';

export interface DataSources {
	readonlyDataSource: {
		course: CourseRepository;
	};
}

export function createDataSources(): Promise<DataSources> {
	return Promise.resolve({
		readonlyDataSource: {
			course: buildCourseRepository(),
		},
	});
}

function buildCourseRepository(): CourseRepository {
	const courses = courseFixtures.map((props) => Course.getNewInstance(props, systemCatalogPassport, catalogReadVisa));

	return {
		get(id: string): Promise<Course> {
			const found = courses.find((course) => course.id === id);
			if (found === undefined) {
				return Promise.reject(new NotFoundError(`Course ${id} was not found.`));
			}
			return Promise.resolve(found);
		},
		save(item: Course): Promise<Course> {
			return Promise.resolve(item);
		},
		search(criteria: CourseSearchCriteria): Promise<CourseSearchPageResult> {
			return Promise.resolve(buildCourseSearchPage(criteria, courses));
		},
	};
}

function buildCourseSearchPage(criteria: CourseSearchCriteria, courses: readonly Course[]): CourseSearchPageResult {
	const filtered = courses.filter((course) => matches(course, criteria));
	const sorted = filtered.slice().sort((left, right) => compareCourses(left, right, criteria.sort));
	const totalItems = sorted.length;
	const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / criteria.pageSize);
	const start = (criteria.page - 1) * criteria.pageSize;
	const items = sorted.slice(start, start + criteria.pageSize).map(toRecord);

	return {
		items,
		page: criteria.page,
		pageSize: criteria.pageSize,
		totalItems,
		totalPages,
	};
}

interface CourseSearchPageResult {
	items: CourseRecord[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

function matches(course: Course, criteria: CourseSearchCriteria): boolean {
	if (criteria.modality !== undefined && course.modality !== criteria.modality) {
		return false;
	}
	if (criteria.status !== undefined && course.status !== criteria.status) {
		return false;
	}
	if (criteria.tag !== undefined) {
		const needle = criteria.tag.toLocaleLowerCase();
		const tagged = course.tags.some((tag: string) => tag.toLocaleLowerCase() === needle);
		if (!tagged) {
			return false;
		}
	}
	if (criteria.q !== undefined) {
		const needle = criteria.q.toLocaleLowerCase();
		const inTitle = course.title.toLocaleLowerCase().includes(needle);
		const inSummary = course.summary.toLocaleLowerCase().includes(needle);
		const inTags = course.tags.some((tag: string) => tag.toLocaleLowerCase().includes(needle));
		if (!inTitle && !inSummary && !inTags) {
			return false;
		}
	}
	return true;
}

function compareCourses(left: Course, right: Course, sort: CourseSortField): number {
	const primary = compareText(readSortValue(left, sort), readSortValue(right, sort));
	if (primary !== 0) {
		return primary;
	}
	return compareText(left.id, right.id);
}

function readSortValue(course: Course, sort: CourseSortField): string {
	if (sort === 'title') {
		return course.title;
	}
	if (sort === 'createdAt') {
		return course.createdAt;
	}
	return course.updatedAt;
}

function compareText(left: string, right: string): number {
	if (left < right) {
		return -1;
	}
	if (left > right) {
		return 1;
	}
	return 0;
}

function toRecord(course: Course): CourseRecord {
	return {
		id: course.id,
		title: course.title,
		summary: course.summary,
		modality: course.modality,
		status: course.status,
		tags: [...course.tags],
		createdAt: course.createdAt,
		updatedAt: course.updatedAt,
	};
}
