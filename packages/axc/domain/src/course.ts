export const COURSE_MODALITIES = ['online', 'in-person', 'hybrid'] as const;
export const COURSE_STATUSES = ['draft', 'active', 'retired'] as const;
export const COURSE_SORTS = ['title', 'createdAt', 'updatedAt'] as const;

export type CourseModality = (typeof COURSE_MODALITIES)[number];
export type CourseStatus = (typeof COURSE_STATUSES)[number];
export type CourseSort = (typeof COURSE_SORTS)[number];

export interface Course {
	id: string;
	title: string;
	summary: string;
	modality: CourseModality;
	status: CourseStatus;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

export interface CourseSearchQuery {
	q?: string;
	modality?: CourseModality;
	status?: CourseStatus;
	tag?: string;
	page: number;
	pageSize: number;
	sort: CourseSort;
}

export interface CoursePage {
	items: Course[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

const COURSE_CATALOG: readonly Course[] = [
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
		title: 'Workshop for Incident Response',
		summary: 'Tabletop exercises for response teams.',
		modality: 'in-person',
		status: 'active',
		tags: ['security'],
		createdAt: '2026-01-10T00:00:00.000Z',
		updatedAt: '2026-01-11T00:00:00.000Z',
	},
	{
		id: 'course-003',
		title: 'Leadership Lab',
		summary: 'Practice decisions with a mixed cohort.',
		modality: 'hybrid',
		status: 'draft',
		tags: ['leadership'],
		createdAt: '2026-01-20T00:00:00.000Z',
		updatedAt: '2026-03-03T00:00:00.000Z',
	},
	{
		id: 'course-004',
		title: 'Compliance Basics',
		summary: 'Record-keeping rules for training programs.',
		modality: 'online',
		status: 'retired',
		tags: ['compliance'],
		createdAt: '2025-11-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
	},
	{
		id: 'course-005',
		title: 'Data Privacy Draft',
		summary: 'Draft notes on personal data handling.',
		modality: 'online',
		status: 'draft',
		tags: ['privacy', 'ai'],
		createdAt: '2026-04-04T00:00:00.000Z',
		updatedAt: '2026-04-05T00:00:00.000Z',
	},
	{
		id: 'course-006',
		title: 'Classroom Facilitation',
		summary: 'Practice leading a live classroom.',
		modality: 'in-person',
		status: 'active',
		tags: ['teaching'],
		createdAt: '2026-02-02T00:00:00.000Z',
		updatedAt: '2026-02-20T00:00:00.000Z',
	},
	{
		id: 'course-007',
		title: 'Cloud Operations',
		summary: 'Operate hybrid cloud environments.',
		modality: 'hybrid',
		status: 'active',
		tags: ['cloud', 'security'],
		createdAt: '2026-03-01T00:00:00.000Z',
		updatedAt: '2026-07-01T00:00:00.000Z',
	},
	{
		id: 'course-008',
		title: 'Writing for Engineers',
		summary: 'Clear technical documents for engineering teams.',
		modality: 'online',
		status: 'active',
		tags: ['writing'],
		createdAt: '2026-02-14T00:00:00.000Z',
		updatedAt: '2026-09-01T00:00:00.000Z',
	},
	{
		id: 'course-009',
		title: 'Onsite Safety',
		summary: 'Physical classroom safety briefing.',
		modality: 'in-person',
		status: 'retired',
		tags: ['safety'],
		createdAt: '2025-06-01T00:00:00.000Z',
		updatedAt: '2025-12-01T00:00:00.000Z',
	},
	{
		id: 'course-010',
		title: 'Design Studio',
		summary: 'Studio critiques for hybrid design teams.',
		modality: 'hybrid',
		status: 'draft',
		tags: ['design', 'ai'],
		createdAt: '2026-05-05T00:00:00.000Z',
		updatedAt: '2026-05-06T00:00:00.000Z',
	},
	{
		id: 'course-011',
		title: 'Threat Modeling',
		summary: 'Model threats and review security controls.',
		modality: 'online',
		status: 'active',
		tags: ['threat'],
		createdAt: '2026-07-07T00:00:00.000Z',
		updatedAt: '2026-07-08T00:00:00.000Z',
	},
	{
		id: 'course-012',
		title: 'Network SECURITY Lab',
		summary: 'Hands-on packet analysis.',
		modality: 'in-person',
		status: 'active',
		tags: ['networking'],
		createdAt: '2026-08-01T00:00:00.000Z',
		updatedAt: '2026-08-02T00:00:00.000Z',
	},
];

export function searchCourses(query: CourseSearchQuery): CoursePage {
	const matched = COURSE_CATALOG.filter((course) => matches(course, query));
	matched.sort((left, right) => compareCourses(query.sort, left, right));
	const totalItems = matched.length;
	const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / query.pageSize);
	const start = (query.page - 1) * query.pageSize;
	return {
		items: matched.slice(start, start + query.pageSize).map(copyCourse),
		page: query.page,
		pageSize: query.pageSize,
		totalItems,
		totalPages,
	};
}

function matches(course: Course, query: CourseSearchQuery): boolean {
	if (query.q !== undefined && !keywordMatches(course, query.q)) {
		return false;
	}
	if (query.modality !== undefined && course.modality !== query.modality) {
		return false;
	}
	if (query.status !== undefined && course.status !== query.status) {
		return false;
	}
	if (query.tag !== undefined) {
		const needle = query.tag.toLowerCase();
		if (!course.tags.some((tag) => tag.toLowerCase() === needle)) {
			return false;
		}
	}
	return true;
}

function keywordMatches(course: Course, keyword: string): boolean {
	const needle = keyword.toLowerCase();
	return course.title.toLowerCase().includes(needle) || course.summary.toLowerCase().includes(needle) || course.tags.some((tag) => tag.toLowerCase().includes(needle));
}

function compareCourses(sort: CourseSort, left: Course, right: Course): number {
	const compared = sort === 'title' ? left.title.localeCompare(right.title, 'en', { sensitivity: 'base' }) : left[sort].localeCompare(right[sort]);
	return compared === 0 ? left.id.localeCompare(right.id) : compared;
}

function copyCourse(course: Course): Course {
	return { ...course, tags: [...course.tags] };
}
