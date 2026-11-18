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
	c(2, 'Cloud Architecture Basics', 'Design patterns for SECURITY-aware cloud systems.', 'hybrid', 'active', ['cloud'], '2025-03-10', '2026-02-01'),
	c(3, 'Machine Learning in Practice', 'Hands-on model training workshop.', 'in-person', 'active', ['ai', 'ml'], '2025-07-20', '2025-12-05'),
	c(4, 'Data Privacy Essentials', 'Regulations and practical privacy controls.', 'online', 'draft', ['privacy', 'Security'], '2026-04-02', '2026-04-02'),
	c(5, 'Agile Team Leadership', 'Lead agile teams with confidence.', 'in-person', 'retired', ['leadership', 'agile'], '2024-11-11', '2025-05-30'),
	c(6, 'Prompt Engineering', 'Writing effective prompts for large language models.', 'online', 'active', ['AI', 'llm'], '2026-02-14', '2026-05-20'),
	c(7, 'Kubernetes Operations', 'Run containers at scale.', 'hybrid', 'draft', ['cloud', 'devops'], '2025-09-01', '2026-01-10'),
	c(8, 'Secure Coding in TypeScript', 'Avoid common vulnerabilities in TS apps.', 'online', 'retired', ['typescript', 'appsec'], '2024-06-06', '2025-01-01'),
	c(9, 'Clinical Data Analytics', 'Analytics techniques for healthcare data.', 'in-person', 'active', ['data', 'healthcare'], '2025-05-05', '2025-08-08'),
	c(10, 'Design Thinking Workshop', 'Human-centered problem solving.', 'hybrid', 'active', ['design'], '2025-01-20', '2026-03-03'),
	c(11, 'Network Defense', 'Monitoring and incident response basics.', 'in-person', 'draft', ['security', 'networking'], '2026-05-01', '2026-05-15'),
	c(12, 'Accessibility for Web', 'Build inclusive web experiences.', 'online', 'active', ['a11y', 'web'], '2025-02-02', '2025-10-10'),
	c(13, 'Zero Trust Security Models', 'Modern identity-centric defense.', 'hybrid', 'retired', ['security', 'identity'], '2024-08-08', '2025-04-04'),
];
