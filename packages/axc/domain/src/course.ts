export const courseModalities = ['online', 'in-person', 'hybrid'] as const;
export type CourseModality = (typeof courseModalities)[number];

export const courseStatuses = ['draft', 'active', 'retired'] as const;
export type CourseStatus = (typeof courseStatuses)[number];

export interface Course {
	id: string;
	title: string;
	summary: string;
	modality: CourseModality;
	status: CourseStatus;
	tags: readonly string[];
	createdAt: string;
	updatedAt: string;
}

// shortcut: static catalog fixture, inject a CourseCatalog from apps/api when courses are stored
export const catalogCourses: readonly Course[] = [
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
		title: 'Classroom Incident Response',
		summary: 'Hands-on lab for campus response teams.',
		modality: 'in-person',
		status: 'active',
		tags: ['security', 'operations'],
		createdAt: '2026-02-01T00:00:00.000Z',
		updatedAt: '2026-05-01T00:00:00.000Z',
	},
	{
		id: 'course-003',
		title: 'Hybrid Leadership Studio',
		summary: 'Practice leading blended cohorts.',
		modality: 'hybrid',
		status: 'draft',
		tags: ['leadership'],
		createdAt: '2026-03-01T00:00:00.000Z',
		updatedAt: '2026-03-15T00:00:00.000Z',
	},
	{
		id: 'course-004',
		title: 'Data Privacy Basics',
		summary: 'How personal data is collected and retained.',
		modality: 'online',
		status: 'retired',
		tags: ['privacy'],
		createdAt: '2025-11-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
	},
	{
		id: 'course-005',
		title: 'New Hire Onboarding',
		summary: 'First week for classroom instructors.',
		modality: 'in-person',
		status: 'draft',
		tags: ['onboarding'],
		createdAt: '2026-04-01T00:00:00.000Z',
		updatedAt: '2026-04-02T00:00:00.000Z',
	},
	{
		id: 'course-006',
		title: 'Applied Machine Learning',
		summary: 'Models for course recommendation.',
		modality: 'hybrid',
		status: 'active',
		tags: ['AI', 'ml'],
		createdAt: '2026-01-20T00:00:00.000Z',
		updatedAt: '2026-07-01T00:00:00.000Z',
	},
	{
		id: 'course-007',
		title: 'Online Facilitation',
		summary: 'Run live remote sessions.',
		modality: 'online',
		status: 'draft',
		tags: ['facilitation'],
		createdAt: '2026-05-01T00:00:00.000Z',
		updatedAt: '2026-05-10T00:00:00.000Z',
	},
	{
		id: 'course-008',
		title: 'Training Ethics',
		summary: 'Retired classroom ethics seminar.',
		modality: 'in-person',
		status: 'retired',
		tags: ['ethics'],
		createdAt: '2025-06-01T00:00:00.000Z',
		updatedAt: '2025-12-01T00:00:00.000Z',
	},
	{
		id: 'course-009',
		title: 'Compliance for Authors',
		summary: 'Policy checks before publication.',
		modality: 'hybrid',
		status: 'retired',
		tags: ['compliance'],
		createdAt: '2025-08-01T00:00:00.000Z',
		updatedAt: '2026-02-01T00:00:00.000Z',
	},
	{
		id: 'course-010',
		title: 'Manager Toolkit',
		summary: 'Security awareness for people managers.',
		modality: 'online',
		status: 'active',
		tags: ['management'],
		createdAt: '2026-02-15T00:00:00.000Z',
		updatedAt: '2026-04-20T00:00:00.000Z',
	},
	{
		id: 'course-011',
		title: 'Cloud Lab Operations',
		summary: 'Keep shared labs available.',
		modality: 'hybrid',
		status: 'active',
		tags: ['cloud', 'security'],
		createdAt: '2026-03-20T00:00:00.000Z',
		updatedAt: '2026-06-15T00:00:00.000Z',
	},
	{
		id: 'course-012',
		title: 'Assessment Design',
		summary: 'Write fair practical assessments.',
		modality: 'in-person',
		status: 'active',
		tags: ['assessment'],
		createdAt: '2026-04-15T00:00:00.000Z',
		updatedAt: '2026-04-18T00:00:00.000Z',
	},
];
