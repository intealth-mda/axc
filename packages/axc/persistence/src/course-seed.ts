import type { CourseProps } from '@axc/domain';

const c = (n: number, title: string, summary: string, modality: CourseProps['modality'], status: CourseProps['status'], tags: string[]): CourseProps => ({
	id: `course-${String(n).padStart(3, '0')}`,
	title,
	summary,
	modality,
	status,
	tags,
	createdAt: `2026-01-${String(n).padStart(2, '0')}T00:00:00.000Z`,
	updatedAt: `2026-06-${String(13 - n).padStart(2, '0')}T00:00:00.000Z`,
});

export const courseSeed: CourseProps[] = [
	c(1, 'AI Security Foundations', 'Introductory course on secure AI-assisted development.', 'online', 'active', ['ai', 'security']),
	c(2, 'Draft Cloud Architecture', 'Upcoming course on cloud design.', 'hybrid', 'draft', ['cloud']),
	c(3, 'Legacy Mainframe Basics', 'Retired introduction to mainframes.', 'in-person', 'retired', ['legacy']),
	c(4, 'Secure Code Review', 'Finding vulnerabilities during review.', 'in-person', 'active', ['security', 'code-review']),
	c(5, 'Prompt Engineering', 'Working effectively with language models.', 'online', 'active', ['ai']),
	c(6, 'Data Privacy Essentials', 'Handling personal data responsibly.', 'hybrid', 'active', ['privacy', 'compliance']),
	c(7, 'Kubernetes in Practice', 'Running containers at scale.', 'online', 'draft', ['cloud', 'devops']),
	c(8, 'Threat Modeling Workshop', 'Hands-on threat modeling for teams.', 'in-person', 'active', ['security']),
	c(9, 'Machine Learning Ops', 'Deploying and monitoring ML models.', 'hybrid', 'active', ['ai', 'devops']),
	c(10, 'Accessible Web Design', 'Building inclusive interfaces.', 'online', 'active', ['web', 'accessibility']),
	c(11, 'Incident Response', 'Handling security incidents end to end.', 'hybrid', 'retired', ['security', 'operations']),
	c(12, 'TypeScript Deep Dive', 'Advanced types and patterns.', 'online', 'active', ['web', 'typescript']),
];
