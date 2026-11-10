import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

const passport = { read: true } as const;

describe('Course aggregate', () => {
	it('creates a course from valid props', () => {
		const course = Course.getNewInstance(
			{
				id: 'course-001',
				title: 'AI Security Foundations',
				summary: 'Introductory course on secure AI-assisted development.',
				modality: 'online',
				status: 'active',
				tags: ['ai', 'security'],
				createdAt: '2026-01-15T00:00:00.000Z',
				updatedAt: '2026-06-01T00:00:00.000Z',
			},
			passport,
		);

		expect(course.id).toBe('course-001');
		expect(course.title).toBe('AI Security Foundations');
		expect(course.summary).toContain('secure AI-assisted');
		expect(course.modality).toBe('online');
		expect(course.status).toBe('active');
		expect(course.tags).toEqual(['ai', 'security']);
		expect(course.createdAt).toBe('2026-01-15T00:00:00.000Z');
		expect(course.updatedAt).toBe('2026-06-01T00:00:00.000Z');
		expect(course.allows((permissions) => permissions.canReadCatalog)).toBe(true);
	});

	it('rejects an unknown modality', () => {
		expect(() =>
			Course.getNewInstance(
				{
					id: 'course-x',
					title: 'Bad modality',
					summary: 'Rejected by the modality value object.',
					modality: 'remote',
					status: 'active',
					tags: [],
					createdAt: '2026-01-01T00:00:00.000Z',
					updatedAt: '2026-01-01T00:00:00.000Z',
				},
				passport,
			),
		).toThrow(/modality/i);
	});

	it('rejects an unknown status', () => {
		expect(() =>
			Course.getNewInstance(
				{
					id: 'course-y',
					title: 'Bad status',
					summary: 'Rejected by the status value object.',
					modality: 'online',
					status: 'paused',
					tags: [],
					createdAt: '2026-01-01T00:00:00.000Z',
					updatedAt: '2026-01-01T00:00:00.000Z',
				},
				passport,
			),
		).toThrow(/status/i);
	});
});
