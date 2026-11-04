const courseModalities = ['online', 'in-person', 'hybrid'] as const;
export type CourseModality = (typeof courseModalities)[number];

const courseStatuses = ['draft', 'active', 'retired'] as const;
export type CourseStatus = (typeof courseStatuses)[number];

const courseSortFields = ['title', 'createdAt', 'updatedAt'] as const;
export type CourseSortField = (typeof courseSortFields)[number];

const enrollmentStatuses = ['pending', 'approved', 'rejected', 'cancelled'] as const;
export type EnrollmentStatus = (typeof enrollmentStatuses)[number];

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

export interface CoursePage {
	items: Course[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

export interface CourseRepository {
	list(): Promise<readonly Course[]>;
	getById(id: string): Promise<Course | undefined>;
}

export interface StatusHistoryEntry {
	fromStatus: EnrollmentStatus | null;
	toStatus: EnrollmentStatus;
	changedAt: string;
	changedBy: string;
	reason: string | null;
}

export interface EnrollmentRequest {
	id: string;
	courseId: string;
	learnerEmail: string;
	justification: string;
	status: EnrollmentStatus;
	createdAt: string;
	updatedAt: string;
	statusHistory: StatusHistoryEntry[];
}

export interface EnrollmentRequestRepository {
	list(): Promise<readonly EnrollmentRequest[]>;
	getById(id: string): Promise<EnrollmentRequest | undefined>;
	add(request: EnrollmentRequest): Promise<void>;
	save(request: EnrollmentRequest): Promise<void>;
}

export function isCourseModality(value: string): value is CourseModality {
	return (courseModalities as readonly string[]).includes(value);
}

export function isCourseStatus(value: string): value is CourseStatus {
	return (courseStatuses as readonly string[]).includes(value);
}

export function isCourseSortField(value: string): value is CourseSortField {
	return (courseSortFields as readonly string[]).includes(value);
}

export function isEnrollmentStatus(value: string): value is EnrollmentStatus {
	return (enrollmentStatuses as readonly string[]).includes(value);
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
		title: 'Security Basics',
		summary: 'Workplace basics for new campus staff.',
		modality: 'in-person',
		status: 'active',
		tags: ['compliance'],
		createdAt: '2026-02-01T00:00:00.000Z',
		updatedAt: '2026-02-01T00:00:00.000Z',
	},
	{
		id: 'course-003',
		title: 'Cloud Operations',
		summary: 'Operate shared cloud environments.',
		modality: 'online',
		status: 'draft',
		tags: ['cloud'],
		createdAt: '2026-02-15T00:00:00.000Z',
		updatedAt: '2026-02-15T00:00:00.000Z',
	},
	{
		id: 'course-004',
		title: 'Hybrid Leadership',
		summary: 'Lead teams that split time across sites.',
		modality: 'hybrid',
		status: 'active',
		tags: ['leadership'],
		createdAt: '2026-03-01T00:00:00.000Z',
		updatedAt: '2026-03-01T00:00:00.000Z',
	},
	{
		id: 'course-005',
		title: 'Retired Security Lab',
		summary: 'Former lab course kept for records.',
		modality: 'online',
		status: 'retired',
		tags: ['security'],
		createdAt: '2026-03-15T00:00:00.000Z',
		updatedAt: '2026-03-15T00:00:00.000Z',
	},
	{
		id: 'course-006',
		title: 'Data Privacy',
		summary: 'Handle personal data in training systems.',
		modality: 'in-person',
		status: 'draft',
		tags: ['privacy'],
		createdAt: '2026-04-01T00:00:00.000Z',
		updatedAt: '2026-04-01T00:00:00.000Z',
	},
	{
		id: 'course-007',
		title: 'Hybrid Security Workshop',
		summary: 'Workshop retired after the 2025 cohort.',
		modality: 'hybrid',
		status: 'retired',
		tags: ['security'],
		createdAt: '2026-04-15T00:00:00.000Z',
		updatedAt: '2026-04-15T00:00:00.000Z',
	},
	{
		id: 'course-008',
		title: 'Intro to Python',
		summary: 'Learn Python syntax, small programs, and runbooks.',
		modality: 'online',
		status: 'active',
		tags: ['programming'],
		createdAt: '2026-05-01T00:00:00.000Z',
		updatedAt: '2026-05-01T00:00:00.000Z',
	},
	{
		id: 'course-009',
		title: 'Onsite Safety',
		summary: 'Safety drills for training rooms.',
		modality: 'in-person',
		status: 'active',
		tags: ['safety', 'security'],
		createdAt: '2026-05-15T00:00:00.000Z',
		updatedAt: '2026-05-15T00:00:00.000Z',
	},
	{
		id: 'course-010',
		title: 'AI for Analysts',
		summary: 'Draft notes for analyst workflows.',
		modality: 'hybrid',
		status: 'draft',
		tags: ['AI'],
		createdAt: '2026-06-01T00:00:00.000Z',
		updatedAt: '2026-06-01T00:00:00.000Z',
	},
	{
		id: 'course-011',
		title: 'Archived Compliance',
		summary: 'Retired compliance lecture.',
		modality: 'online',
		status: 'retired',
		tags: ['compliance'],
		createdAt: '2026-06-15T00:00:00.000Z',
		updatedAt: '2026-06-15T00:00:00.000Z',
	},
	{
		id: 'course-012',
		title: 'Platform Engineering',
		summary: 'Operational practices for platform teams, including SECURITY reviews.',
		modality: 'hybrid',
		status: 'active',
		tags: ['platform'],
		createdAt: '2026-07-01T00:00:00.000Z',
		updatedAt: '2026-07-01T00:00:00.000Z',
	},
];
