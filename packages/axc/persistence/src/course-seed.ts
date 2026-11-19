import type { CourseProps } from '@axc/domain';

const c = (n: number, title: string, summary: string, modality: CourseProps['modality'], status: CourseProps['status'], tags: string[]): CourseProps => {
	const id = `course-${String(n).padStart(3, '0')}`;
	const m = String(n).padStart(2, '0');
	return { id, title, summary, modality, status, tags, createdAt: `2026-01-${m}T00:00:00.000Z`, updatedAt: `2026-06-${m}T00:00:00.000Z` };
};

export const courseSeed: readonly CourseProps[] = [
	c(1, 'AI Security Foundations', 'Introductory course on secure AI-assisted development.', 'online', 'active', ['ai', 'security']),
	c(2, 'Secure Coding in TypeScript', 'Write safer TypeScript services.', 'online', 'active', ['security', 'typescript']),
	c(3, 'Cloud Architecture Basics', 'Design resilient cloud systems.', 'hybrid', 'active', ['cloud', 'architecture']),
	c(4, 'Prompt Engineering Workshop', 'Hands-on prompting for teams.', 'in-person', 'active', ['ai', 'prompting']),
	c(5, 'Data Privacy Essentials', 'Privacy law and practice for engineers.', 'online', 'draft', ['privacy', 'compliance']),
	c(6, 'Legacy Mainframe Operations', 'Operating classic mainframe workloads.', 'in-person', 'retired', ['mainframe']),
	c(7, 'Agile Leadership', 'Leading agile delivery teams.', 'hybrid', 'active', ['leadership', 'agile']),
	c(8, 'Threat Modeling Lab', 'Practical threat modeling with STRIDE.', 'in-person', 'active', ['security', 'threat-modeling']),
	c(9, 'Machine Learning Ops', 'Ship and monitor ML models.', 'online', 'draft', ['ai', 'mlops']),
	c(10, 'Accessible Web Design', 'Build inclusive web interfaces.', 'online', 'active', ['accessibility', 'web']),
	c(11, 'Kubernetes in Practice', 'Run containers at scale.', 'hybrid', 'retired', ['cloud', 'kubernetes']),
	c(12, 'Incident Response Drills', 'Rehearse security incident handling.', 'hybrid', 'draft', ['security', 'operations']),
];
