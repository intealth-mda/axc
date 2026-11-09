import type { CourseProps } from '@axc/domain';

const c = (n: number, title: string, summary: string, modality: CourseProps['modality'], status: CourseProps['status'], tags: string[]): CourseProps => {
	const id = `course-${String(n).padStart(3, '0')}`;
	const month = String(n).padStart(2, '0');
	return { id, title, summary, modality, status, tags, createdAt: `2025-${month}-15T00:00:00.000Z`, updatedAt: `2026-${month}-01T00:00:00.000Z` };
};

export const COURSE_SEED: readonly CourseProps[] = [
	c(1, 'AI Security Foundations', 'Introductory course on secure AI-assisted development.', 'online', 'active', ['ai', 'security']),
	c(2, 'Threat Modeling Workshop', 'Hands-on threat modeling for web services.', 'in-person', 'draft', ['security']),
	c(3, 'Legacy Java Maintenance', 'Maintaining older Java systems.', 'hybrid', 'retired', ['java']),
	c(4, 'Prompt Engineering Basics', 'Writing effective prompts for large language models.', 'online', 'active', ['ai', 'llm']),
	c(5, 'Cloud Fundamentals', 'Core concepts of cloud computing on Azure.', 'online', 'active', ['cloud', 'azure']),
	c(6, 'Secure Coding in TypeScript', 'Avoiding common vulnerabilities in TypeScript code.', 'hybrid', 'active', ['security', 'typescript']),
	c(7, 'Data Privacy Essentials', 'GDPR and HIPAA basics for engineers.', 'in-person', 'active', ['privacy', 'compliance']),
	c(8, 'Kubernetes in Practice', 'Deploying and operating containers at scale.', 'hybrid', 'draft', ['cloud', 'containers']),
	c(9, 'Agile Leadership', 'Leading teams with agile practices.', 'in-person', 'active', ['leadership']),
	c(10, 'Machine Learning Ops', 'Shipping ML models to production.', 'online', 'retired', ['ai', 'mlops']),
	c(11, 'Accessibility for Developers', 'Building inclusive user interfaces.', 'online', 'active', ['accessibility', 'frontend']),
	c(12, 'Incident Response Drills', 'Practicing security incident response.', 'in-person', 'active', ['security', 'operations']),
];
