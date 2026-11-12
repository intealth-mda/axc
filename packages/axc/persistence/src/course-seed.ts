import type { CourseProps } from '@axc/domain';

const c = (n: number, title: string, summary: string, modality: CourseProps['modality'], status: CourseProps['status'], tags: string[], createdAt: string, updatedAt: string): CourseProps => ({
	id: `course-${String(n).padStart(3, '0')}`,
	title,
	summary,
	modality,
	status,
	tags,
	createdAt,
	updatedAt,
});

export const courseSeed: CourseProps[] = [
	c(1, 'AI Security Foundations', 'Introductory course on secure AI-assisted development.', 'online', 'active', ['ai', 'security'], '2026-01-15T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
	c(2, 'Secure Coding in TypeScript', 'Write safer TypeScript services.', 'hybrid', 'active', ['typescript', 'security'], '2026-02-01T00:00:00.000Z', '2026-05-01T00:00:00.000Z'),
	c(3, 'Machine Learning Basics', 'Core ML concepts for engineers.', 'online', 'active', ['ai', 'ml'], '2026-01-05T00:00:00.000Z', '2026-03-10T00:00:00.000Z'),
	c(4, 'Cloud Architecture Workshop', 'Hands-on design of cloud systems.', 'in-person', 'active', ['cloud', 'architecture'], '2026-03-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
	c(5, 'Legacy Mainframe Operations', 'Operating classic mainframe workloads.', 'in-person', 'retired', ['mainframe'], '2025-06-01T00:00:00.000Z', '2025-12-01T00:00:00.000Z'),
	c(6, 'Prompt Engineering Lab', 'Practical prompt design for AI tools.', 'online', 'draft', ['ai', 'prompting'], '2026-05-20T00:00:00.000Z', '2026-05-21T00:00:00.000Z'),
	c(7, 'Data Privacy Essentials', 'Handling personal data and SECURITY controls.', 'hybrid', 'active', ['privacy', 'compliance'], '2026-02-15T00:00:00.000Z', '2026-02-20T00:00:00.000Z'),
	c(8, 'Agile Team Leadership', 'Leading agile delivery teams.', 'in-person', 'active', ['leadership', 'agile'], '2025-11-01T00:00:00.000Z', '2026-01-10T00:00:00.000Z'),
	c(9, 'DevOps Pipelines', 'Continuous integration and delivery.', 'online', 'retired', ['devops', 'ci'], '2025-09-01T00:00:00.000Z', '2025-10-01T00:00:00.000Z'),
	c(10, 'Threat Modeling Clinic', 'Identify threats before you ship.', 'hybrid', 'draft', ['security', 'architecture'], '2026-04-10T00:00:00.000Z', '2026-04-11T00:00:00.000Z'),
	c(11, 'Accessible Web Design', 'Build inclusive web interfaces.', 'online', 'active', ['web', 'accessibility'], '2026-03-15T00:00:00.000Z', '2026-06-15T00:00:00.000Z'),
	c(12, 'Kubernetes in Practice', 'Run containers in production.', 'hybrid', 'active', ['cloud', 'containers'], '2025-12-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z'),
];
