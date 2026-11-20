import type { CourseProps } from '@axc/domain';

const c = (n: number, title: string, summary: string, modality: CourseProps['modality'], status: CourseProps['status'], tags: string[], created: string, updated: string): CourseProps => ({
	id: `course-${String(n).padStart(3, '0')}`,
	title,
	summary,
	modality,
	status,
	tags,
	createdAt: `${created}T00:00:00.000Z`,
	updatedAt: `${updated}T00:00:00.000Z`,
});

export const courseSeed: CourseProps[] = [
	c(1, 'AI Security Foundations', 'Introductory course on secure AI-assisted development.', 'online', 'active', ['ai', 'security'], '2026-01-15', '2026-06-01'),
	c(2, 'Cloud Architecture Basics', 'Design scalable systems in the cloud.', 'hybrid', 'active', ['cloud', 'architecture'], '2025-11-02', '2026-02-10'),
	c(3, 'Prompt Engineering', 'Write effective prompts for LLMs.', 'online', 'draft', ['AI', 'llm'], '2026-03-05', '2026-03-20'),
	c(4, 'Secure Coding in TypeScript', 'Avoid common vulnerabilities.', 'in-person', 'active', ['typescript', 'Security'], '2025-08-12', '2026-04-01'),
	c(5, 'Data Privacy Essentials', 'GDPR and privacy SECURITY practices.', 'online', 'retired', ['privacy', 'compliance'], '2024-05-01', '2025-01-15'),
	c(6, 'Leadership for Engineers', 'Lead technical teams.', 'in-person', 'draft', ['leadership'], '2026-02-14', '2026-02-28'),
	c(7, 'Kubernetes Operations', 'Run containers in production.', 'hybrid', 'retired', ['cloud', 'devops'], '2024-09-09', '2025-06-30'),
	c(8, 'Machine Learning 101', 'Intro to ML models and data.', 'online', 'active', ['ai', 'ml'], '2025-12-01', '2026-05-05'),
	c(9, 'Agile Delivery', 'Scrum and kanban in practice.', 'in-person', 'active', ['agile', 'process'], '2025-03-03', '2025-10-10'),
	c(10, 'Incident Response', 'Handle security incidents calmly.', 'hybrid', 'draft', ['ops', 'incident'], '2026-04-04', '2026-04-20'),
	c(11, 'Accessible Web Design', 'Build inclusive web interfaces.', 'online', 'retired', ['a11y', 'web'], '2024-01-20', '2024-12-12'),
	c(12, 'Zero Trust Networking', 'Modern network defense.', 'in-person', 'retired', ['network', 'security'], '2025-07-07', '2025-09-09'),
];
