import type { CourseProps } from '@axc/domain';

const c = (n: number, title: string, summary: string, modality: CourseProps['modality'], status: CourseProps['status'], tags: string[]): CourseProps => ({
	id: `course-${String(n).padStart(3, '0')}`,
	title,
	summary,
	modality,
	status,
	tags,
	createdAt: `2026-01-${String(n).padStart(2, '0')}T00:00:00.000Z`,
	updatedAt: `2026-06-${String(29 - n).padStart(2, '0')}T00:00:00.000Z`,
});

export const courseSeed: CourseProps[] = [
	c(1, 'AI Security Foundations', 'Introductory course on secure AI-assisted development.', 'online', 'active', ['ai', 'security']),
	c(2, 'Cloud Architecture Basics', 'Design patterns for cloud systems.', 'hybrid', 'active', ['cloud', 'architecture']),
	c(3, 'Prompt Engineering', 'Writing effective prompts for LLMs.', 'online', 'draft', ['AI', 'llm']),
	c(4, 'Network Defense', 'Hands-on SECURITY lab for networks.', 'in-person', 'active', ['networking']),
	c(5, 'Data Privacy Law', 'Regulations for personal data.', 'online', 'retired', ['privacy', 'legal']),
	c(6, 'Agile Leadership', 'Leading agile teams.', 'in-person', 'draft', ['leadership']),
	c(7, 'Kubernetes in Practice', 'Container orchestration workshop.', 'hybrid', 'active', ['cloud', 'devops']),
	c(8, 'Machine Learning 101', 'Intro to supervised learning.', 'online', 'active', ['ai', 'ml']),
	c(9, 'Secure Coding in TypeScript', 'Avoiding common vulnerabilities.', 'hybrid', 'draft', ['security', 'typescript']),
	c(10, 'Legacy Mainframe Ops', 'Operating mainframe systems.', 'in-person', 'retired', ['mainframe']),
	c(11, 'Data Visualization', 'Charts that communicate.', 'online', 'active', ['data', 'design']),
	c(12, 'Incident Response', 'Handling security incidents.', 'in-person', 'active', ['security', 'ops']),
];
