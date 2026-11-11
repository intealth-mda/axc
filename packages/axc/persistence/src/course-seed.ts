import type { CourseProps } from '@axc/domain';

const c = (n: number, title: string, summary: string, modality: CourseProps['modality'], status: CourseProps['status'], tags: string[]): CourseProps => ({
	id: `course-${String(n).padStart(3, '0')}`,
	title,
	summary,
	modality,
	status,
	tags,
	createdAt: new Date(Date.UTC(2026, 0, 31 - n)).toISOString(),
	updatedAt: new Date(Date.UTC(2026, 5, n)).toISOString(),
});

export const courseSeed: CourseProps[] = [
	c(1, 'AI Security Foundations', 'Introductory course on secure AI-assisted development.', 'online', 'active', ['ai', 'security']),
	c(2, 'Cloud Architecture Basics', 'Design scalable systems in the cloud.', 'hybrid', 'active', ['cloud', 'architecture']),
	c(3, 'Threat Modeling Workshop', 'Hands-on SECURITY threat analysis.', 'in-person', 'active', ['appsec']),
	c(4, 'Prompt Engineering', 'Write effective prompts for LLMs.', 'online', 'draft', ['AI', 'llm']),
	c(5, 'Data Privacy Essentials', 'GDPR and privacy by design.', 'online', 'retired', ['privacy', 'compliance']),
	c(6, 'Kubernetes in Practice', 'Run containers in production.', 'hybrid', 'draft', ['cloud', 'devops']),
	c(7, 'Secure Code Review', 'Find vulnerabilities in code.', 'in-person', 'retired', ['Security', 'appsec']),
	c(8, 'Machine Learning 101', 'Foundations of supervised learning.', 'online', 'active', ['ai', 'ml']),
	c(9, 'Agile Leadership', 'Lead teams through change.', 'in-person', 'active', ['leadership']),
	c(10, 'DevOps Pipelines', 'Continuous delivery end to end.', 'hybrid', 'active', ['devops', 'ci']),
	c(11, 'Incident Response', 'Handle breaches calmly.', 'online', 'active', ['security', 'operations']),
	c(12, 'Accessible Web Design', 'Build inclusive interfaces.', 'hybrid', 'retired', ['ux', 'accessibility']),
];
