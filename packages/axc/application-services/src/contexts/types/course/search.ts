import type { CourseEntityReference } from '@axc/domain';
import type { DataSources } from './data-sources.ts';

export type CourseSort = 'title' | 'createdAt' | 'updatedAt';

export interface CourseSearchCommand {
	q?: string;
	modality?: string;
	status?: string;
	tag?: string;
	page?: number;
	pageSize?: number;
	sort?: CourseSort;
}

export interface CourseListItem {
	id: string;
	title: string;
	summary: string;
	modality: string;
	status: string;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

export interface CoursePage {
	items: CourseListItem[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

type CourseEntity = CourseEntityReference;

const defaultPage = 1;
const defaultPageSize = 10;
const defaultSort: CourseSort = 'title';

function contains(value: string, needle: string): boolean {
	return value.toLocaleLowerCase().includes(needle);
}

function matches(course: CourseEntity, command: CourseSearchCommand): boolean {
	if (command.modality !== undefined && course.modality !== command.modality) {
		return false;
	}
	if (command.status !== undefined && course.status !== command.status) {
		return false;
	}
	if (command.tag !== undefined) {
		const tag = command.tag.toLocaleLowerCase();
		if (!course.tags.some((candidate) => candidate.toLocaleLowerCase() === tag)) {
			return false;
		}
	}
	if (command.q !== undefined) {
		const needle = command.q.toLocaleLowerCase();
		const fields = [course.title, course.summary, ...course.tags];
		if (!fields.some((field) => contains(field, needle))) {
			return false;
		}
	}
	return true;
}

function compareCourses(left: CourseEntity, right: CourseEntity, sort: CourseSort): number {
	if (sort === 'title') {
		const byTitle = left.title.localeCompare(right.title, 'en', { sensitivity: 'base' });
		if (byTitle !== 0) {
			return byTitle;
		}
	} else {
		const byDate = left[sort].getTime() - right[sort].getTime();
		if (byDate !== 0) {
			return byDate;
		}
	}
	return left.id.localeCompare(right.id);
}

function toItem(course: CourseEntity): CourseListItem {
	return {
		id: course.id,
		title: course.title,
		summary: course.summary,
		modality: course.modality,
		status: course.status,
		tags: [...course.tags],
		createdAt: course.createdAt.toISOString(),
		updatedAt: course.updatedAt.toISOString(),
	};
}

export const search = (dataSources: DataSources) => {
	return async (command: CourseSearchCommand): Promise<CoursePage> => {
		const page = command.page ?? defaultPage;
		const pageSize = command.pageSize ?? defaultPageSize;
		const sort = command.sort ?? defaultSort;
		const courses = await dataSources.readonlyDataSource.Types.Course.CourseReadRepo.getAll();
		const matched = courses.filter((course) => matches(course, command));
		const sorted = matched.slice().sort((left, right) => compareCourses(left, right, sort));
		const totalItems = sorted.length;
		const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
		const start = (page - 1) * pageSize;
		return {
			items: sorted.slice(start, start + pageSize).map(toItem),
			page,
			pageSize,
			totalItems,
			totalPages,
		};
	};
};
