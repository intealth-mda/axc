import type { Course, CourseRepository, EnrollmentRequest, EnrollmentRequestRepository } from '@axc/domain';

export interface CatalogStores {
	courses: CourseRepository;
	enrollmentRequests: EnrollmentRequestRepository;
}

// shortcut: data lives in one process and resets on restart, upgrade when enrollment data must outlive the API process
export function createCatalogStores(): CatalogStores {
	const courses = seedCourses.map(copyCourse);
	const requests: EnrollmentRequest[] = [];
	return {
		courses: {
			list() {
				return Promise.resolve(courses.map(copyCourse));
			},
		},
		enrollmentRequests: {
			list() {
				return Promise.resolve(requests.map(copyRequest));
			},
			findById(id) {
				const found = requests.find((request) => request.id === id);
				return Promise.resolve(found === undefined ? undefined : copyRequest(found));
			},
			save(request) {
				const stored = copyRequest(request);
				const index = requests.findIndex((item) => item.id === stored.id);
				if (index === -1) {
					requests.push(stored);
				} else {
					requests[index] = stored;
				}
				return Promise.resolve();
			},
		},
	};
}

function copyCourse(course: Course): Course {
	return { ...course, tags: [...course.tags] };
}

function copyRequest(request: EnrollmentRequest): EnrollmentRequest {
	return { ...request, statusHistory: request.statusHistory.map((entry) => ({ ...entry })) };
}

const seedCourses: readonly Course[] = [
	course('course-001', 'AI Security Foundations', 'Introductory course on secure AI-assisted development.', 'online', 'active', ['ai', 'security'], '2026-01-15', '2026-06-01'),
	course('course-002', 'Cloud Security Basics', 'Core controls for cloud training environments.', 'online', 'active', ['security', 'cloud'], '2026-02-01', '2026-06-02'),
	course('course-003', 'Secure Coding Lab', 'Hands-on secure coding practice.', 'in-person', 'active', ['security', 'coding'], '2026-02-10', '2026-05-01'),
	course('course-004', 'Hybrid Incident Response', 'Coordinate incident response across rooms and remote seats.', 'hybrid', 'active', ['security', 'incident'], '2026-03-01', '2026-06-03'),
	course('course-005', 'Teaching With AI', 'Practical AI techniques for classroom instruction.', 'online', 'active', ['ai', 'teaching'], '2026-03-15', '2026-06-04'),
	course('course-006', 'Platform Engineering', 'Operate the training platform.', 'online', 'active', ['platform'], '2026-04-01', '2026-06-05'),
	course('course-007', 'Leadership Workshop', 'Facilitation skills for course leads.', 'in-person', 'active', ['leadership'], '2026-04-02', '2026-06-06'),
	course('course-008', 'Data Privacy Draft', 'Draft privacy module for reviewers.', 'online', 'draft', ['privacy', 'security'], '2026-04-03', '2026-04-04'),
	course('course-009', 'Hybrid Onboarding', 'Draft onboarding session for new learners.', 'hybrid', 'draft', ['onboarding'], '2026-05-01', '2026-05-02'),
	course('course-010', 'Classroom Facilitation', 'Retired room-facilitation course.', 'in-person', 'retired', ['teaching'], '2026-01-01', '2026-03-01'),
	course('course-011', 'Compliance Archive', 'Retired compliance overview.', 'online', 'retired', ['compliance', 'security'], '2026-01-20', '2026-02-20'),
	course('course-012', 'Instructor Studio', 'Retired hybrid studio course.', 'hybrid', 'retired', ['ai'], '2026-06-01', '2026-06-07'),
];

function course(id: string, title: string, summary: string, modality: Course['modality'], status: Course['status'], tags: string[], createdDay: string, updatedDay: string): Course {
	return {
		id,
		title,
		summary,
		modality,
		status,
		tags,
		createdAt: `${createdDay}T00:00:00.000Z`,
		updatedAt: `${updatedDay}T00:00:00.000Z`,
	};
}
