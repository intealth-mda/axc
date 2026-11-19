import { Course, type CourseModality, type CourseStatus } from '@axc/domain';

const rows: [string, string, CourseModality, CourseStatus, string[], string, string][] = [
	['AI Security Foundations', 'Introductory course on secure AI-assisted development.', 'online', 'active', ['ai', 'security'], '2026-01-15', '2026-06-01'],
	['Clinical Communication Skills', 'Practice patient conversations with peers.', 'in-person', 'active', ['communication', 'clinical'], '2025-03-10', '2025-09-12'],
	['Data Privacy Essentials', 'Protecting personal data and SECURITY of records.', 'hybrid', 'active', ['privacy', 'compliance'], '2025-07-01', '2026-02-20'],
	['Machine Learning Basics', 'Hands-on introduction to models and datasets.', 'online', 'draft', ['AI', 'data'], '2026-03-05', '2026-03-05'],
	['Leadership in Healthcare', 'Lead teams through change.', 'in-person', 'retired', ['leadership'], '2024-02-11', '2025-01-30'],
	['Prompt Engineering Workshop', 'Write effective prompts for assistants.', 'hybrid', 'active', ['ai', 'productivity'], '2026-04-18', '2026-07-02'],
	['Network Defense', 'Firewalls, monitoring and incident response.', 'online', 'retired', ['security', 'networking'], '2023-11-20', '2024-12-01'],
	['Ethics in Medicine', 'Case studies in medical ethics.', 'online', 'active', ['ethics', 'clinical'], '2025-05-22', '2025-11-08'],
	['Cloud Fundamentals', 'Core cloud computing concepts.', 'online', 'draft', ['cloud'], '2026-05-30', '2026-08-14'],
	['Simulation Lab Orientation', 'Get ready for simulation-based training.', 'in-person', 'active', ['simulation', 'clinical'], '2024-09-09', '2026-01-10'],
	['Secure Coding Practices', 'Avoid common vulnerabilities in code.', 'hybrid', 'draft', ['security', 'coding'], '2026-02-14', '2026-06-21'],
	['Assessment Design', 'Build fair and valid assessments.', 'hybrid', 'retired', ['assessment', 'education'], '2024-06-03', '2025-04-17'],
];

export const courseSeed = (): Course[] =>
	rows.map(
		([title, summary, modality, status, tags, created, updated], i) =>
			new Course({ id: `course-${String(i + 1).padStart(3, '0')}`, title, summary, modality, status, tags, createdAt: `${created}T00:00:00.000Z`, updatedAt: `${updated}T00:00:00.000Z` }, undefined),
	);
