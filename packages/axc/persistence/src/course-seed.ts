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

export const courseSeed: CourseProps[] = [
	c(1, 'AI Security Foundations', 'Introductory course on secure AI-assisted development.', 'online', 'active', ['ai', 'security'], '2026-01-15', '2026-06-01'),
	c(2, 'Clinical Documentation Basics', 'Writing clear patient records.', 'in-person', 'active', ['clinical', 'writing'], '2025-03-10', '2026-02-01'),
	c(3, 'Hybrid Team Leadership', 'Leading distributed teams.', 'hybrid', 'draft', ['leadership'], '2026-04-02', '2026-04-20'),
	c(4, 'Prompt Engineering', 'Practical prompting for AI tools.', 'online', 'draft', ['AI', 'productivity'], '2026-05-05', '2026-05-06'),
	c(5, 'Network Defense', 'Firewalls, monitoring and SECURITY operations.', 'in-person', 'retired', ['networking'], '2024-08-01', '2025-01-01'),
	c(6, 'Data Privacy Essentials', 'Handling personal data lawfully.', 'online', 'active', ['privacy', 'compliance'], '2025-07-07', '2026-03-03'),
	c(7, 'Medical Ethics Seminar', 'Case discussions in ethics.', 'hybrid', 'active', ['ethics', 'clinical'], '2025-09-09', '2025-12-12'),
	c(8, 'Legacy Systems Maintenance', 'Keeping older systems running.', 'in-person', 'retired', ['operations'], '2023-02-02', '2024-02-02'),
	c(9, 'Cloud Fundamentals', 'Intro to cloud computing.', 'online', 'active', ['cloud', 'Security'], '2025-11-11', '2026-01-20'),
	c(10, 'Machine Learning Lab', 'Hands-on ML projects.', 'hybrid', 'active', ['ai', 'data'], '2026-02-14', '2026-07-01'),
	c(11, 'Public Speaking', 'Confident presentations.', 'in-person', 'draft', ['communication'], '2026-06-06', '2026-06-07'),
	c(12, 'Quality Improvement', 'Process improvement methods.', 'online', 'retired', ['quality', 'operations'], '2024-04-04', '2025-05-05'),
];
