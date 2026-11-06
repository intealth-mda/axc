import type { CourseProps } from '@axc/domain';

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

export const courseSeed: readonly CourseProps[] = [
	c(1, 'AI Security Foundations', 'Introductory course on secure AI-assisted development.', 'online', 'active', ['ai', 'security'], '2026-01-15', '2026-06-01'),
	c(2, 'Clinical Data Privacy', 'Protecting patient records and SECURITY of health data.', 'in-person', 'active', ['privacy', 'compliance'], '2025-11-02', '2026-02-10'),
	c(3, 'Prompt Engineering Workshop', 'Hands-on prompting for large language models.', 'hybrid', 'active', ['AI', 'llm'], '2026-03-01', '2026-03-05'),
	c(4, 'Network Defense Basics', 'Firewalls, segmentation and monitoring.', 'online', 'draft', ['Security', 'networking'], '2026-04-20', '2026-04-21'),
	c(5, 'Medical Ethics Seminar', 'Case studies in professional ethics.', 'in-person', 'retired', ['ethics'], '2024-09-10', '2025-01-12'),
	c(6, 'Data Visualization', 'Charts and dashboards for analysts.', 'online', 'active', ['data', 'analytics'], '2025-06-30', '2026-05-15'),
	c(7, 'Leadership in Healthcare', 'Leading interdisciplinary teams.', 'hybrid', 'draft', ['leadership'], '2026-02-14', '2026-02-14'),
	c(8, 'Machine Learning 101', 'Supervised learning fundamentals with AI tooling.', 'online', 'active', ['ml', 'ai'], '2025-08-08', '2026-01-20'),
	c(9, 'Incident Response Drills', 'Tabletop exercises for security incidents.', 'in-person', 'active', ['security', 'operations'], '2025-12-01', '2026-04-02'),
	c(10, 'Accessibility by Design', 'Inclusive design for digital services.', 'online', 'retired', ['design', 'a11y'], '2024-05-05', '2024-12-12'),
	c(11, 'Cloud Fundamentals', 'Core cloud concepts and shared responsibility.', 'hybrid', 'active', ['cloud', 'security'], '2025-03-03', '2025-10-10'),
	c(12, 'Writing Clear Documentation', 'Technical writing for engineers.', 'online', 'draft', ['writing'], '2026-05-01', '2026-05-02'),
];
