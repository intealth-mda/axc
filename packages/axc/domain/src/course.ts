export const courseModalities = ['online', 'in-person', 'hybrid'] as const;
export type CourseModality = (typeof courseModalities)[number];

export const courseStatuses = ['draft', 'active', 'retired'] as const;
export type CourseStatus = (typeof courseStatuses)[number];

export const courseSorts = ['title', 'createdAt', 'updatedAt'] as const;
export type CourseSort = (typeof courseSorts)[number];

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

export interface CourseRepository {
	list(): Promise<readonly Course[]>;
	getById(id: string): Promise<Course | undefined>;
}

export const seedCourses: readonly Course[] = [
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
		title: 'Workshop: Physical Security',
		summary: 'Hands-on facility controls.',
		modality: 'in-person',
		status: 'active',
		tags: ['facilities'],
		createdAt: '2026-02-01T00:00:00.000Z',
		updatedAt: '2026-02-02T00:00:00.000Z',
	},
	{
		id: 'course-003',
		title: 'Hybrid Delivery Practicum',
		summary: 'Practice teaching hybrid sessions.',
		modality: 'hybrid',
		status: 'draft',
		tags: ['teaching'],
		createdAt: '2026-03-01T00:00:00.000Z',
		updatedAt: '2026-03-02T00:00:00.000Z',
	},
	{
		id: 'course-004',
		title: 'Legacy Systems',
		summary: 'Retired overview of old platforms.',
		modality: 'online',
		status: 'retired',
		tags: ['legacy'],
		createdAt: '2025-05-01T00:00:00.000Z',
		updatedAt: '2025-12-01T00:00:00.000Z',
	},
	{
		id: 'course-005',
		title: 'Platform Operations',
		summary: 'Covers SECURITY monitoring for on-call staff.',
		modality: 'online',
		status: 'active',
		tags: ['operations'],
		createdAt: '2026-04-01T00:00:00.000Z',
		updatedAt: '2026-04-03T00:00:00.000Z',
	},
	{
		id: 'course-006',
		title: 'Tag Matching Lab',
		summary: 'Exercises for catalog tags.',
		modality: 'hybrid',
		status: 'active',
		tags: ['Security'],
		createdAt: '2026-04-15T00:00:00.000Z',
		updatedAt: '2026-04-16T00:00:00.000Z',
	},
	{
		id: 'course-007',
		title: 'AI Ethics',
		summary: 'Responsible use of AI tools.',
		modality: 'online',
		status: 'draft',
		tags: ['ai', 'ethics'],
		createdAt: '2026-05-01T00:00:00.000Z',
		updatedAt: '2026-05-02T00:00:00.000Z',
	},
	{
		id: 'course-008',
		title: 'Cloud Defense',
		summary: 'Active hybrid cloud defense.',
		modality: 'hybrid',
		status: 'active',
		tags: ['cloud'],
		createdAt: '2026-05-10T00:00:00.000Z',
		updatedAt: '2026-05-11T00:00:00.000Z',
	},
	{
		id: 'course-009',
		title: 'Incident Response Drill',
		summary: 'Retired in-person drill.',
		modality: 'in-person',
		status: 'retired',
		tags: ['incident'],
		createdAt: '2024-08-01T00:00:00.000Z',
		updatedAt: '2025-01-01T00:00:00.000Z',
	},
	{
		id: 'course-010',
		title: 'Prompt Engineering',
		summary: 'Writing prompts for coding assistants.',
		modality: 'online',
		status: 'active',
		tags: ['AI'],
		createdAt: '2026-06-01T00:00:00.000Z',
		updatedAt: '2026-06-02T00:00:00.000Z',
	},
	{
		id: 'course-011',
		title: 'Accessibility Basics',
		summary: 'Inclusive course design.',
		modality: 'in-person',
		status: 'active',
		tags: ['accessibility'],
		createdAt: '2026-01-02T00:00:00.000Z',
		updatedAt: '2026-01-03T00:00:00.000Z',
	},
	{
		id: 'course-012',
		title: 'Threat Modeling Studio',
		summary: 'Model threats before release.',
		modality: 'hybrid',
		status: 'active',
		tags: ['design'],
		createdAt: '2026-07-01T00:00:00.000Z',
		updatedAt: '2026-07-02T00:00:00.000Z',
	},
];
