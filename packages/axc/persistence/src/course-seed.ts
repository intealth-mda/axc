import type { CourseProps } from '@axc/domain';

const c = (n: number, title: string, summary: string, modality: CourseProps['modality'], status: CourseProps['status'], tags: string[], created: string, updated: string): CourseProps => ({
	id: `course-${String(n).padStart(3, '0')}`,
	title,
	summary,
	modality,
	status,
	tags,
	createdAt: `${created}T00:00:00.000Z`,
	updatedAt: `${updated}T00:00:00.000Z`,
});

export const courseSeed: readonly CourseProps[] = [
	c(1, 'AI Security Foundations', 'Introductory course on secure AI-assisted development.', 'online', 'active', ['ai', 'security'], '2026-01-15', '2026-06-01'),
	c(2, 'Prompt Engineering Basics', 'Write effective prompts for language models.', 'online', 'active', ['ai', 'prompting'], '2025-11-02', '2026-02-10'),
	c(3, 'Network Defense Workshop', 'Hands-on SECURITY lab for firewalls and IDS.', 'in-person', 'active', ['networking'], '2025-08-20', '2026-03-05'),
	c(4, 'Cloud Architecture', 'Design resilient systems on the cloud.', 'hybrid', 'active', ['cloud', 'architecture'], '2025-05-11', '2026-01-20'),
	c(5, 'Data Privacy Essentials', 'Regulations and practices for personal data.', 'online', 'draft', ['privacy', 'Security'], '2026-03-01', '2026-03-02'),
	c(6, 'Machine Learning Ops', 'Deploy and monitor ML models.', 'hybrid', 'draft', ['AI', 'devops'], '2026-02-14', '2026-04-18'),
	c(7, 'Legacy Mainframe Systems', 'COBOL maintenance for older platforms.', 'in-person', 'retired', ['mainframe'], '2023-04-04', '2024-01-01'),
	c(8, 'Agile Team Leadership', 'Lead scrum teams with confidence.', 'in-person', 'active', ['leadership', 'agile'], '2025-09-09', '2025-12-12'),
	c(9, 'Secure Coding in TypeScript', 'Avoid common vulnerabilities in web apps.', 'online', 'active', ['typescript', 'appsec'], '2025-10-10', '2026-05-05'),
	c(10, 'Intro to Kubernetes', 'Containers and orchestration fundamentals.', 'hybrid', 'retired', ['cloud', 'devops'], '2024-06-06', '2025-01-15'),
	c(11, 'Technical Writing', 'Clear documentation for engineers.', 'online', 'retired', ['writing'], '2024-02-02', '2024-08-08'),
	c(12, 'Incident Response Drills', 'Practice responding to security incidents.', 'in-person', 'draft', ['security', 'operations'], '2026-04-01', '2026-04-15'),
	c(13, 'Accessibility for Designers', 'Build inclusive interfaces.', 'hybrid', 'active', ['design', 'a11y'], '2025-07-07', '2026-02-01'),
];
