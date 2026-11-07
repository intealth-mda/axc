import type { CourseRecord } from '@axc/data-sources-mongoose-models';

const titles = [
	['AI Security Foundations', 'secure AI-assisted development', 'online', 'active', ['ai', 'security']],
	['Cloud Security Operations', 'cloud defense practice', 'hybrid', 'active', ['cloud', 'security']],
	['Applied AI Research', 'research methods for AI', 'online', 'active', ['ai', 'research']],
	['Security Leadership', 'security team practices', 'in-person', 'active', ['leadership', 'security']],
	['Archived Security Basics', 'security history', 'online', 'retired', ['security']],
	['Draft Security Lab', 'security scenarios', 'online', 'draft', ['security']],
	['Data Science Basics', 'data methods', 'hybrid', 'active', ['data']],
	['Modern TypeScript', 'typescript development', 'online', 'active', ['coding']],
	['Kubernetes Fundamentals', 'container operations', 'in-person', 'active', ['cloud']],
	['Product Design', 'design methods', 'hybrid', 'draft', ['design']],
	['Advanced Testing', 'software quality', 'online', 'active', ['coding']],
	['Incident Response', 'response exercises', 'in-person', 'retired', ['security']],
] as const;
export const courseFixtures: CourseRecord[] = titles.map(([title, summary, modality, status, tags], i) => ({
	id: `course-${String(i + 1).padStart(3, '0')}`,
	title,
	summary,
	modality,
	status,
	tags: [...tags],
	createdAt: new Date(Date.UTC(2026, 0, i + 1)).toISOString(),
	updatedAt: new Date(Date.UTC(2026, 5, i + 1)).toISOString(),
}));
