import type { CourseModality, CourseProps, CourseStatus } from '@axc/domain';

const row = (n: number, title: string, summary: string, modality: CourseModality, status: CourseStatus, tags: string[], created: string, updated: string): CourseProps => ({
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
	row(1, 'AI Security Foundations', 'Introductory course on secure AI-assisted development.', 'online', 'active', ['ai', 'security'], '2026-01-15', '2026-06-01'),
	row(2, 'Secure Coding in TypeScript', 'Write safer TypeScript services.', 'hybrid', 'active', ['security', 'typescript'], '2026-02-01', '2026-05-10'),
	row(3, 'Prompt Engineering Basics', 'Getting useful output from language models.', 'online', 'active', ['ai', 'prompting'], '2026-03-05', '2026-03-20'),
	row(4, 'Cloud Architecture Workshop', 'Hands-on design of resilient cloud systems.', 'in-person', 'active', ['cloud', 'architecture'], '2025-11-12', '2026-04-02'),
	row(5, 'Data Privacy Essentials', 'Privacy law and practice for engineers.', 'online', 'retired', ['privacy', 'compliance'], '2025-06-01', '2025-12-01'),
	row(6, 'Machine Learning Ops', 'Deploying and monitoring ML models.', 'hybrid', 'draft', ['ai', 'devops'], '2026-05-01', '2026-05-15'),
	row(7, 'Threat Modeling Lab', 'Find threats before attackers do.', 'in-person', 'active', ['security', 'design'], '2025-09-09', '2026-02-14'),
	row(8, 'Accessible Web Design', 'Build interfaces everyone can use.', 'online', 'active', ['accessibility', 'frontend'], '2025-10-20', '2026-01-30'),
	row(9, 'Agile Leadership', 'Leading delivery teams with agility.', 'in-person', 'retired', ['leadership', 'agile'], '2024-08-01', '2025-03-01'),
	row(10, 'Kubernetes Deep Dive', 'Operate containers at scale.', 'hybrid', 'active', ['cloud', 'devops'], '2026-04-11', '2026-06-10'),
	row(11, 'Responsible AI Governance', 'Policy and oversight for AI systems.', 'online', 'draft', ['ai', 'governance'], '2026-06-01', '2026-06-05'),
	row(12, 'Incident Response Drills', 'Practice handling security incidents.', 'in-person', 'active', ['security', 'operations'], '2025-12-03', '2026-03-03'),
];
