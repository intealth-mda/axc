import { Course, type CourseProps, type CourseRepository, EnrollmentRequest, type EnrollmentRequestRepository, type NewEnrollmentRequestInput } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';

const seedCourses: CourseProps[] = [
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
		title: 'Cloud Architecture Basics',
		summary: 'Design patterns for scalable cloud systems.',
		modality: 'hybrid',
		status: 'active',
		tags: ['cloud'],
		createdAt: '2026-02-01T00:00:00.000Z',
		updatedAt: '2026-02-10T00:00:00.000Z',
	},
	{
		id: 'course-003',
		title: 'Secure Coding Workshop',
		summary: 'Hands-on SECURITY practice for developers.',
		modality: 'in-person',
		status: 'active',
		tags: ['coding'],
		createdAt: '2025-11-10T00:00:00.000Z',
		updatedAt: '2026-03-05T00:00:00.000Z',
	},
	{
		id: 'course-004',
		title: 'Prompt Engineering Draft',
		summary: 'Working with large language models.',
		modality: 'online',
		status: 'draft',
		tags: ['AI'],
		createdAt: '2026-03-01T00:00:00.000Z',
		updatedAt: '2026-03-01T00:00:00.000Z',
	},
	{
		id: 'course-005',
		title: 'Legacy Mainframe Operations',
		summary: 'Operating retired mainframe platforms.',
		modality: 'in-person',
		status: 'retired',
		tags: ['legacy'],
		createdAt: '2024-05-01T00:00:00.000Z',
		updatedAt: '2025-01-01T00:00:00.000Z',
	},
	{
		id: 'course-006',
		title: 'Data Privacy Essentials',
		summary: 'Privacy and compliance fundamentals.',
		modality: 'online',
		status: 'active',
		tags: ['privacy', 'compliance'],
		createdAt: '2026-04-01T00:00:00.000Z',
		updatedAt: '2026-04-15T00:00:00.000Z',
	},
];

class InMemoryRepository<T extends { id: string }> {
	protected readonly items = new Map<string, T>();
	getById(id: string): Promise<T | undefined> {
		return Promise.resolve(this.items.get(id));
	}
	async get(id: string): Promise<T> {
		const item = await this.getById(id);
		if (!item) throw new NotFoundError(`${id} not found`);
		return item;
	}
	getAll(): Promise<T[]> {
		return Promise.resolve([...this.items.values()]);
	}
	save(item: T): Promise<T> {
		this.items.set(item.id, item);
		return Promise.resolve(item);
	}
}

export class InMemoryCourseRepository extends InMemoryRepository<Course> implements CourseRepository {
	constructor(courses: CourseProps[] = seedCourses) {
		super();
		for (const props of courses) this.items.set(props.id, this.getNewInstance(props));
	}
	getNewInstance(props: CourseProps): Course {
		return Course.getNewInstance(props);
	}
}

export class InMemoryEnrollmentRequestRepository extends InMemoryRepository<EnrollmentRequest> implements EnrollmentRequestRepository {
	private sequence = 0;
	getNewInstance(input: NewEnrollmentRequestInput): EnrollmentRequest {
		const request = EnrollmentRequest.getNewInstance(`enroll-${String(this.sequence + 1).padStart(3, '0')}`, input, new Date().toISOString());
		this.sequence += 1;
		return request;
	}
}
