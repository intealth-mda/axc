import type { CourseProps } from '@axc/domain';

const at = (month: number) => `2026-${String(month).padStart(2, '0')}-15T00:00:00.000Z`;

export const COURSE_SEED: readonly CourseProps[] = [
	{ id: 'course-001', title: 'AI Security Foundations', summary: 'Introductory course on secure AI-assisted development.', modality: 'online', status: 'active', tags: ['ai', 'security'], createdAt: at(1), updatedAt: at(6) },
	{ id: 'course-002', title: 'Secure Coding in TypeScript', summary: 'Writing safe, typed server code.', modality: 'hybrid', status: 'active', tags: ['typescript', 'security'], createdAt: at(2), updatedAt: at(5) },
	{ id: 'course-003', title: 'Prompt Engineering Basics', summary: 'Getting reliable output from language models.', modality: 'online', status: 'active', tags: ['ai'], createdAt: at(3), updatedAt: at(4) },
	{ id: 'course-004', title: 'Cloud Architecture Workshop', summary: 'Hands-on design of cloud systems.', modality: 'in-person', status: 'active', tags: ['cloud', 'architecture'], createdAt: at(4), updatedAt: at(7) },
	{ id: 'course-005', title: 'Data Privacy Essentials', summary: 'Handling personal data responsibly.', modality: 'online', status: 'draft', tags: ['privacy', 'compliance'], createdAt: at(5), updatedAt: at(5) },
	{ id: 'course-006', title: 'Legacy Mainframe Operations', summary: 'Operating COBOL batch systems.', modality: 'in-person', status: 'retired', tags: ['operations'], createdAt: at(1), updatedAt: at(2) },
	{ id: 'course-007', title: 'Machine Learning in Practice', summary: 'Training and evaluating models.', modality: 'hybrid', status: 'active', tags: ['ai', 'data'], createdAt: at(6), updatedAt: at(8) },
	{ id: 'course-008', title: 'Threat Modeling', summary: 'Finding SECURITY risks before they ship.', modality: 'in-person', status: 'active', tags: ['appsec'], createdAt: at(7), updatedAt: at(9) },
	{ id: 'course-009', title: 'Domain-Driven Design', summary: 'Modeling complex business domains.', modality: 'online', status: 'active', tags: ['architecture'], createdAt: at(8), updatedAt: at(8) },
	{ id: 'course-010', title: 'Accessibility for Web Teams', summary: 'Building inclusive interfaces.', modality: 'hybrid', status: 'draft', tags: ['web', 'accessibility'], createdAt: at(9), updatedAt: at(10) },
	{ id: 'course-011', title: 'Incident Response Drills', summary: 'Practicing on-call response.', modality: 'in-person', status: 'retired', tags: ['operations', 'security'], createdAt: at(2), updatedAt: at(3) },
	{ id: 'course-012', title: 'Kubernetes Fundamentals', summary: 'Running containers at scale.', modality: 'online', status: 'active', tags: ['cloud', 'containers'], createdAt: at(10), updatedAt: at(11) },
];
