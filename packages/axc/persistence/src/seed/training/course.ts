import type { Domain } from '@axc/domain';

type Course = Domain.Contexts.Training.Course.CourseProps;
export const courses: Course[] = [
	{
		id: 'course-001',
		title: 'AI Security Foundations',
		summary: 'Introductory course on secure AI-assisted development.',
		modality: 'online',
		status: 'active',
		tags: ['ai', 'security'],
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-06-12T00:00:00.000Z',
	},
	{
		id: 'course-002',
		title: 'Secure Coding',
		summary: 'Security practices for developers.',
		modality: 'in-person',
		status: 'active',
		tags: ['security'],
		createdAt: '2026-01-02T00:00:00.000Z',
		updatedAt: '2026-06-11T00:00:00.000Z',
	},
	{ id: 'course-003', title: 'Cloud Fundamentals', summary: 'Learn cloud infrastructure.', modality: 'hybrid', status: 'active', tags: ['cloud'], createdAt: '2026-01-03T00:00:00.000Z', updatedAt: '2026-06-10T00:00:00.000Z' },
	{ id: 'course-004', title: 'Data Privacy', summary: 'Protect sensitive information.', modality: 'online', status: 'draft', tags: ['privacy'], createdAt: '2026-01-04T00:00:00.000Z', updatedAt: '2026-06-09T00:00:00.000Z' },
	{ id: 'course-005', title: 'Legacy Systems', summary: 'Maintain older systems.', modality: 'in-person', status: 'retired', tags: ['maintenance'], createdAt: '2026-01-05T00:00:00.000Z', updatedAt: '2026-06-08T00:00:00.000Z' },
	{ id: 'course-006', title: 'Testing Essentials', summary: 'Reliable automated tests.', modality: 'online', status: 'active', tags: ['testing'], createdAt: '2026-01-06T00:00:00.000Z', updatedAt: '2026-06-07T00:00:00.000Z' },
	{ id: 'course-007', title: 'AI Ethics', summary: 'Responsible systems.', modality: 'hybrid', status: 'active', tags: ['ai'], createdAt: '2026-01-07T00:00:00.000Z', updatedAt: '2026-06-06T00:00:00.000Z' },
	{ id: 'course-008', title: 'Threat Modeling', summary: 'Identify application threats.', modality: 'online', status: 'active', tags: ['security'], createdAt: '2026-01-08T00:00:00.000Z', updatedAt: '2026-06-05T00:00:00.000Z' },
	{ id: 'course-009', title: 'DevOps Basics', summary: 'Delivery pipelines.', modality: 'in-person', status: 'draft', tags: ['devops'], createdAt: '2026-01-09T00:00:00.000Z', updatedAt: '2026-06-04T00:00:00.000Z' },
	{ id: 'course-010', title: 'Web Accessibility', summary: 'Inclusive user interfaces.', modality: 'hybrid', status: 'active', tags: ['web'], createdAt: '2026-01-10T00:00:00.000Z', updatedAt: '2026-06-03T00:00:00.000Z' },
	{ id: 'course-011', title: 'Network Design', summary: 'Connectivity fundamentals.', modality: 'online', status: 'retired', tags: ['network'], createdAt: '2026-01-11T00:00:00.000Z', updatedAt: '2026-06-02T00:00:00.000Z' },
	{ id: 'course-012', title: 'Security Leadership', summary: 'Manage secure teams.', modality: 'in-person', status: 'active', tags: ['leadership'], createdAt: '2026-01-12T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
];
