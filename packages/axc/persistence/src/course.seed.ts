import type { CourseProps } from '@axc/domain';

const c = (n: number, title: string, summary: string, modality: CourseProps['modality'], status: CourseProps['status'], tags: string[]): CourseProps => ({
	id: `course-${String(n).padStart(3, '0')}`,
	title,
	summary,
	modality,
	status,
	tags,
	createdAt: new Date(Date.UTC(2026, 0, n)).toISOString(),
	updatedAt: new Date(Date.UTC(2026, 6, 13 - n)).toISOString(),
});

export const courseSeed: CourseProps[] = [
	c(1, 'AI Security Foundations', 'Introductory course on secure AI-assisted development.', 'online', 'active', ['ai', 'security']),
	c(2, 'Cloud Architecture Basics', 'Design patterns for cloud systems.', 'online', 'active', ['cloud']),
	c(3, 'Leadership Workshop', 'Hands-on leadership practice.', 'in-person', 'active', ['leadership']),
	c(4, 'Data Privacy Essentials', 'Protecting personal data and SECURITY controls.', 'hybrid', 'active', ['privacy']),
	c(5, 'Prompt Engineering', 'Working effectively with large language models.', 'online', 'draft', ['AI', 'llm']),
	c(6, 'Network Defense', 'Firewalls, IDS and monitoring.', 'in-person', 'retired', ['Security', 'network']),
	c(7, 'Agile Delivery', 'Scrum and kanban for teams.', 'hybrid', 'active', ['agile']),
	c(8, 'Machine Learning Ops', 'Deploying models to production.', 'online', 'retired', ['ai', 'mlops']),
	c(9, 'Public Speaking', 'Confident presentations.', 'in-person', 'draft', ['communication']),
	c(10, 'Zero Trust Networking', 'Modern network access design.', 'hybrid', 'draft', ['security', 'network']),
	c(11, 'TypeScript Deep Dive', 'Advanced types and tooling.', 'online', 'active', ['typescript']),
	c(12, 'Ethics in AI', 'Responsible use of artificial intelligence.', 'hybrid', 'active', ['ai', 'ethics']),
];
