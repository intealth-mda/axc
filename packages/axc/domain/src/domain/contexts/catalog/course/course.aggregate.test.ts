import { describe, expect, it } from 'vitest';
import { systemCatalogPassport } from '../catalog.passport.ts';
import { Course } from './course.aggregate.ts';

describe('Course aggregate', () => {
	it('creates a readable course', () => {
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
			systemCatalogPassport,
		);

		expect(course.id).toBe('course-001');
		expect(course.props.modality).toBe('online');
		expect(course.allowsRead()).toBe(true);
	});
});
