import type { CourseProps, CourseSearchCriteria, CourseSearchResult, CourseSortField } from '@axc/domain';
import type { CourseReadStore } from './data-sources.ts';

const COURSE_SEED: readonly CourseProps[] = [
	{
		id: 'course-001',
		title: 'AI Security Foundations',
		summary: 'Introductory course on secure AI-assisted development.',
		modality: 'online',
		status: 'active',
		tags: ['ai', 'security'],
		createdAt: '2026-01-15T00:00:00.000Z',
		updatedAt: '2026-06-01T00:00:00.000Z',
	},
	{
		id: 'course-002',
		title: 'In-Person Security Workshop',
		summary: 'Practice incident response drills with a live cohort.',
		modality: 'in-person',
		status: 'active',
		tags: ['workshop'],
		createdAt: '2026-02-01T00:00:00.000Z',
		updatedAt: '2026-05-01T00:00:00.000Z',
	},
	{
		id: 'course-003',
		title: 'Hybrid Leadership Lab',
		summary: 'Build team habits that improve security culture.',
		modality: 'hybrid',
		status: 'draft',
		tags: ['leadership'],
		createdAt: '2026-03-01T00:00:00.000Z',
		updatedAt: '2026-04-01T00:00:00.000Z',
	},
	{
		id: 'course-004',
		title: 'Data Privacy Basics',
		summary: 'Handle personal data with care.',
		modality: 'online',
		status: 'retired',
		tags: ['privacy', 'Security'],
		createdAt: '2026-04-01T00:00:00.000Z',
		updatedAt: '2026-03-01T00:00:00.000Z',
	},
	{
		id: 'course-005',
		title: 'Classroom Facilitation',
		summary: 'Lead an in-room training day.',
		modality: 'in-person',
		status: 'active',
		tags: ['teaching'],
		createdAt: '2025-01-01T00:00:00.000Z',
		updatedAt: '2025-06-01T00:00:00.000Z',
	},
	{
		id: 'course-006',
		title: 'Hybrid Cloud Operations',
		summary: 'Operate cloud workloads across sites.',
		modality: 'hybrid',
		status: 'active',
		tags: ['cloud', 'ops'],
		createdAt: '2025-02-01T00:00:00.000Z',
		updatedAt: '2025-07-01T00:00:00.000Z',
	},
	{
		id: 'course-007',
		title: 'Draft Onboarding Paths',
		summary: 'Prepare a draft onboarding curriculum.',
		modality: 'online',
		status: 'draft',
		tags: ['onboarding'],
		createdAt: '2025-03-01T00:00:00.000Z',
		updatedAt: '2025-08-01T00:00:00.000Z',
	},
	{
		id: 'course-008',
		title: 'Retired Mainframe Skills',
		summary: 'Historical operations curriculum kept for reference.',
		modality: 'in-person',
		status: 'retired',
		tags: ['legacy'],
		createdAt: '2024-06-01T00:00:00.000Z',
		updatedAt: '2024-07-01T00:00:00.000Z',
	},
	{
		id: 'course-009',
		title: 'AI Ethics for Practitioners',
		summary: 'Apply ethics reviews to AI-enabled products.',
		modality: 'online',
		status: 'active',
		tags: ['ai', 'ethics'],
		createdAt: '2026-05-01T00:00:00.000Z',
		updatedAt: '2026-07-01T00:00:00.000Z',
	},
	{
		id: 'course-010',
		title: 'Hybrid Product Discovery',
		summary: 'Find product opportunities with mixed workshops.',
		modality: 'hybrid',
		status: 'retired',
		tags: ['product'],
		createdAt: '2024-11-01T00:00:00.000Z',
		updatedAt: '2025-01-15T00:00:00.000Z',
	},
	{
		id: 'course-011',
		title: 'Sales Floor Coaching',
		summary: 'Coach sellers during live floor sessions.',
		modality: 'in-person',
		status: 'draft',
		tags: ['sales'],
		createdAt: '2024-01-15T00:00:00.000Z',
		updatedAt: '2026-08-01T00:00:00.000Z',
	},
	{
		id: 'course-012',
		title: 'Online Writing Lab',
		summary: 'Practice clear technical writing.',
		modality: 'online',
		status: 'active',
		tags: ['writing'],
		createdAt: '2025-09-01T00:00:00.000Z',
		updatedAt: '2026-02-01T00:00:00.000Z',
	},
];

function cloneCourse(course: CourseProps): CourseProps {
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

function sortValue(course: CourseProps, sort: CourseSortField): string {
	if (sort === 'title') {
		return course.title;
	}
	if (sort === 'createdAt') {
		return course.createdAt;
	}
	return course.updatedAt;
}

function matchesQuery(course: CourseProps, criteria: CourseSearchCriteria): boolean {
	if (criteria.modality !== undefined && course.modality !== criteria.modality) {
		return false;
	}
	if (criteria.status !== undefined && course.status !== criteria.status) {
		return false;
	}
	if (criteria.tag !== undefined) {
		const needle = criteria.tag.toLowerCase();
		const tagged = course.tags.some((tag) => tag.toLowerCase() === needle);
		if (!tagged) {
			return false;
		}
	}
	if (criteria.q !== undefined) {
		const needle = criteria.q.toLowerCase();
		const inTitle = course.title.toLowerCase().includes(needle);
		const inSummary = course.summary.toLowerCase().includes(needle);
		const inTags = course.tags.some((tag) => tag.toLowerCase().includes(needle));
		if (!inTitle && !inSummary && !inTags) {
			return false;
		}
	}
	return true;
}

function searchCourseCatalog(courses: readonly CourseProps[], criteria: CourseSearchCriteria): CourseSearchResult {
	const filtered = courses.filter((course) => matchesQuery(course, criteria));
	const sorted = [...filtered].sort((left, right) => {
		const leftValue = sortValue(left, criteria.sort);
		const rightValue = sortValue(right, criteria.sort);
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
	});
	const totalItems = sorted.length;
	const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / criteria.pageSize);
	const start = (criteria.page - 1) * criteria.pageSize;
	const items = sorted.slice(start, start + criteria.pageSize).map((course) => cloneCourse(course));
	return {
		items,
		page: criteria.page,
		pageSize: criteria.pageSize,
		totalItems,
		totalPages,
	};
}

export function createCourseReadStore(): CourseReadStore {
	const courses = COURSE_SEED.map((course) => cloneCourse(course));
	return {
		search(criteria: CourseSearchCriteria): Promise<CourseSearchResult> {
			return Promise.resolve(searchCourseCatalog(courses, criteria));
		},
	};
}
