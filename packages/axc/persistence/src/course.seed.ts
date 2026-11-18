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

export const courseSeed: CourseProps[] = [
	c(1, 'AI Security Foundations', 'Introductory course on secure AI-assisted development.', 'online', 'active', ['ai', 'security'], '2026-01-15', '2026-06-01'),
	c(2, 'Secure Coding in TypeScript', 'Write safer TypeScript services.', 'online', 'active', ['typescript', 'security'], '2026-02-01', '2026-05-10'),
	c(3, 'Prompt Engineering Basics', 'Getting useful output from language models.', 'online', 'draft', ['ai', 'prompting'], '2026-03-05', '2026-03-05'),
	c(4, 'Cloud Architecture Workshop', 'Hands-on design of resilient cloud systems.', 'in-person', 'active', ['cloud', 'architecture'], '2025-11-20', '2026-04-02'),
	c(5, 'Legacy Mainframe Operations', 'Operating batch workloads on mainframes.', 'in-person', 'retired', ['mainframe', 'operations'], '2024-06-01', '2025-01-15'),
	c(6, 'Data Privacy Essentials', 'Handling personal data with care and SECURITY in mind.', 'hybrid', 'active', ['privacy', 'compliance'], '2026-01-02', '2026-02-20'),
	c(7, 'Machine Learning Ops', 'Deploying and monitoring ML models.', 'hybrid', 'active', ['ai', 'mlops'], '2025-12-12', '2026-06-15'),
	c(8, 'Agile Leadership', 'Leading teams through iterative delivery.', 'in-person', 'active', ['leadership', 'agile'], '2025-09-09', '2026-01-09'),
	c(9, 'Threat Modeling Lab', 'Find design flaws before attackers do.', 'hybrid', 'draft', ['security', 'design'], '2026-04-18', '2026-04-18'),
	c(10, 'Intro to Kubernetes', 'Containers and orchestration from scratch.', 'online', 'retired', ['cloud', 'containers'], '2024-10-10', '2025-08-08'),
	c(11, 'Accessible Web Design', 'Build interfaces everyone can use.', 'online', 'active', ['web', 'accessibility'], '2026-02-14', '2026-03-30'),
	c(12, 'Incident Response Drills', 'Practice responding to production incidents.', 'in-person', 'active', ['operations', 'security'], '2025-10-01', '2026-05-25'),
	c(13, 'Responsible AI Policy', 'Governance of AI systems in the enterprise.', 'hybrid', 'retired', ['ai', 'compliance'], '2025-03-03', '2025-12-01'),
	c(14, 'Domain-Driven Design', 'Modeling complex domains with aggregates.', 'online', 'active', ['architecture', 'design'], '2026-05-01', '2026-06-20'),
];
