import { Course, type NewCourseInput } from '@axc/domain';

type Row = [string, string, string, NewCourseInput['modality'], NewCourseInput['status'], string[], string, string];

const rows: Row[] = [
	['course-001', 'AI Security Foundations', 'Introductory course on secure AI-assisted development.', 'online', 'active', ['ai', 'security'], '2026-01-15', '2026-06-01'],
	['course-002', 'Advanced Threat Modeling', 'Identify and mitigate SECURITY risks in system design.', 'in-person', 'active', ['architecture'], '2025-11-02', '2026-03-10'],
	['course-003', 'Cloud Fundamentals', 'Core cloud computing concepts.', 'online', 'draft', ['cloud'], '2026-02-20', '2026-02-21'],
	['course-004', 'Prompt Engineering', 'Write effective prompts for language models.', 'hybrid', 'active', ['AI', 'llm'], '2025-09-12', '2026-04-05'],
	['course-005', 'Legacy Mainframe Ops', 'Operating COBOL batch systems.', 'in-person', 'retired', ['mainframe'], '2023-05-01', '2024-01-01'],
	['course-006', 'Data Privacy Essentials', 'GDPR and HIPAA basics.', 'online', 'active', ['privacy', 'Security'], '2025-07-07', '2025-12-12'],
	['course-007', 'Kubernetes in Practice', 'Hands-on container orchestration.', 'hybrid', 'draft', ['cloud', 'devops'], '2026-03-03', '2026-05-05'],
	['course-008', 'Agile Leadership', 'Leading teams through iterative delivery.', 'in-person', 'active', ['leadership'], '2024-10-10', '2025-01-20'],
	['course-009', 'Machine Learning Basics', 'Supervised and unsupervised learning.', 'online', 'retired', ['ai', 'data'], '2024-02-14', '2025-02-14'],
	['course-010', 'Secure Coding in TypeScript', 'Avoid common web vulnerabilities.', 'online', 'active', ['typescript', 'web'], '2025-04-18', '2026-01-30'],
	['course-011', 'Zero Trust Networking', 'Network design without implicit trust.', 'hybrid', 'retired', ['network', 'security'], '2023-08-08', '2024-06-06'],
	['course-012', 'Technical Writing', 'Clear documentation for engineers.', 'hybrid', 'active', ['writing'], '2025-06-30', '2025-08-15'],
];

export const courseSeed = (): Course[] =>
	rows.map(([id, title, summary, modality, status, tags, created, updated]) => {
		const c = Course.getNewInstance(id, { title, summary, modality, status, tags }, `${created}T00:00:00.000Z`);
		c.props.updatedAt = `${updated}T00:00:00.000Z`;
		return c;
	});
