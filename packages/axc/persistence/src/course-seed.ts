import type { CourseProps } from '@axc/domain';

const c = (n: number, title: string, summary: string, modality: CourseProps['modality'], status: CourseProps['status'], tags: string[]): CourseProps => {
	const d = String(n).padStart(2, '0');
	return { id: `course-0${d}`, title, summary, modality, status, tags, createdAt: `2026-01-${d}T00:00:00.000Z`, updatedAt: `2026-06-${d}T00:00:00.000Z` };
};

export const courseSeed: CourseProps[] = [
	c(1, 'AI Security Foundations', 'Introductory course on secure AI-assisted development.', 'online', 'active', ['ai', 'security']),
	c(2, 'Secure Coding in TypeScript', 'Write safer TypeScript services.', 'online', 'active', ['security', 'typescript']),
	c(3, 'Cloud Architecture Basics', 'Design resilient cloud systems.', 'hybrid', 'active', ['cloud']),
	c(4, 'Prompt Engineering', 'Practical prompting for AI assistants.', 'online', 'draft', ['ai']),
	c(5, 'Leadership Essentials', 'Lead small engineering teams.', 'in-person', 'active', ['leadership']),
	c(6, 'Legacy Mainframe Ops', 'Operate legacy mainframe systems.', 'in-person', 'retired', ['ops']),
	c(7, 'Data Privacy Law', 'Understand data protection regulation.', 'hybrid', 'active', ['privacy', 'security']),
	c(8, 'Machine Learning 101', 'First steps with machine learning models.', 'online', 'active', ['ai', 'ml']),
	c(9, 'Agile Facilitation', 'Run effective agile ceremonies.', 'in-person', 'draft', ['agile']),
	c(10, 'Threat Modeling Workshop', 'Hands-on threat modeling practice.', 'in-person', 'active', ['security']),
	c(11, 'Kubernetes Operations', 'Run workloads on Kubernetes.', 'hybrid', 'retired', ['cloud', 'ops']),
	c(12, 'Accessible Web Design', 'Build inclusive web interfaces.', 'online', 'active', ['web', 'accessibility']),
	c(13, 'Incident Response', 'Respond to security incidents calmly.', 'hybrid', 'active', ['security', 'ops']),
];
