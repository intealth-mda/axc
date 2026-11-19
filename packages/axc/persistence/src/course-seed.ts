import type { CourseProps } from '@axc/domain';

const c = (n: number, title: string, summary: string, modality: CourseProps['modality'], status: CourseProps['status'], tags: string[]): CourseProps => ({
	id: `course-${String(n).padStart(3, '0')}`,
	title,
	summary,
	modality,
	status,
	tags,
	createdAt: `2026-01-${String(n + 10).padStart(2, '0')}T00:00:00.000Z`,
	updatedAt: `2026-06-${String(30 - n).padStart(2, '0')}T00:00:00.000Z`,
});

export const courseSeed: CourseProps[] = [
	c(1, 'AI Security Foundations', 'Introductory course on secure AI-assisted development.', 'online', 'active', ['ai', 'security']),
	c(2, 'Cloud Architecture Basics', 'Design patterns for cloud systems.', 'hybrid', 'active', ['cloud']),
	c(3, 'Prompt Engineering', 'Write effective prompts for LLMs.', 'online', 'draft', ['AI', 'llm']),
	c(4, 'Secure Coding in TypeScript', 'Avoid common vulnerabilities.', 'in-person', 'active', ['typescript']),
	c(5, 'Legacy Mainframe Ops', 'Operating COBOL workloads.', 'in-person', 'retired', ['mainframe']),
	c(6, 'Data Engineering 101', 'Pipelines and warehouses.', 'online', 'active', ['data']),
	c(7, 'Network Defense', 'Firewalls, IDS and SECURITY monitoring.', 'hybrid', 'draft', ['network']),
	c(8, 'Agile Leadership', 'Lead agile teams.', 'in-person', 'active', ['management']),
	c(9, 'Machine Learning Ops', 'Deploy and monitor models.', 'hybrid', 'active', ['ai', 'mlops']),
	c(10, 'Accessibility Essentials', 'Build inclusive web apps.', 'online', 'retired', ['web', 'a11y']),
	c(11, 'Kubernetes Hands-On', 'Run containers at scale.', 'in-person', 'draft', ['cloud', 'containers']),
	c(12, 'Zero Trust Networking', 'Modern access models.', 'online', 'active', ['security', 'network']),
];
