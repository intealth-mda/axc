import { Course, type CourseProps, type CourseRepository } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';

const c = (n: number, title: string, summary: string, modality: CourseProps['modality'], status: CourseProps['status'], tags: string[], createdAt: string, updatedAt: string): CourseProps => ({
	id: `course-${String(n).padStart(3, '0')}`,
	title,
	summary,
	modality,
	status,
	tags,
	createdAt: `${createdAt}T00:00:00.000Z`,
	updatedAt: `${updatedAt}T00:00:00.000Z`,
});

export const courseSeed: CourseProps[] = [
	c(1, 'AI Security Foundations', 'Introductory course on secure AI-assisted development.', 'online', 'active', ['ai', 'security'], '2026-01-15', '2026-06-01'),
	c(2, 'Clinical Data Privacy', 'Protecting patient records and personal data.', 'hybrid', 'active', ['privacy', 'compliance'], '2025-11-02', '2026-03-10'),
	c(3, 'Prompt Engineering Basics', 'Writing effective prompts for language models.', 'online', 'active', ['AI', 'llm'], '2026-02-20', '2026-02-25'),
	c(4, 'Leadership in Healthcare', 'Leading teams in clinical environments.', 'in-person', 'active', ['leadership'], '2025-08-12', '2026-01-05'),
	c(5, 'Secure Coding Workshop', 'Hands-on lab covering common vulnerabilities.', 'in-person', 'draft', ['Security', 'coding'], '2026-04-01', '2026-04-15'),
	c(6, 'Legacy Systems Overview', 'Maintaining older hospital information systems.', 'online', 'retired', ['legacy'], '2024-05-30', '2025-01-01'),
	c(7, 'Machine Learning for Clinicians', 'Applied ML concepts without the math.', 'hybrid', 'draft', ['ai', 'ml'], '2026-03-03', '2026-05-20'),
	c(8, 'Medical Ethics', 'Ethical frameworks for patient care.', 'in-person', 'active', ['ethics'], '2025-09-09', '2025-12-12'),
	c(9, 'Cloud Fundamentals', 'Core cloud concepts and SECURITY responsibilities.', 'online', 'active', ['cloud'], '2025-10-10', '2026-02-02'),
	c(10, 'Data Visualization', 'Communicating findings with charts.', 'hybrid', 'retired', ['data', 'analytics'], '2024-12-01', '2025-06-06'),
	c(11, 'Agile Project Delivery', 'Iterative planning and delivery practices.', 'online', 'draft', ['agile', 'management'], '2026-05-05', '2026-05-06'),
	c(12, 'Exam Proctoring Essentials', 'Running fair and secure examinations.', 'in-person', 'retired', ['exams', 'operations'], '2024-07-07', '2025-03-03'),
];

export class InMemoryCourseRepository implements CourseRepository {
	private readonly items = new Map<string, Course>();

	constructor(seed: CourseProps[] = courseSeed) {
		for (const props of seed) this.items.set(props.id, Course.getNewInstance(props));
	}
	getNewInstance(props: CourseProps): Course {
		return Course.getNewInstance(props);
	}
	getById(id: string): Promise<Course> {
		const course = this.items.get(id);
		return course ? Promise.resolve(course) : Promise.reject(new NotFoundError(`Course ${id} not found`));
	}
	get(id: string): Promise<Course> {
		return this.getById(id);
	}
	save(item: Course): Promise<Course> {
		this.items.set(item.id, item);
		return Promise.resolve(item);
	}
	getAll(): Promise<Course[]> {
		return Promise.resolve([...this.items.values()]);
	}
}
