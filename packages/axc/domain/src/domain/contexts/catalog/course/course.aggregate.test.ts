import { describe, expect, it } from 'vitest';
import type { CatalogPassport } from '../catalog.passport.ts';
import { Course } from './course.aggregate.ts';

const passport: CatalogPassport = { catalogRead: true };

describe('Course aggregate', () => {
	it('rehydrates a catalog course', () => {
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
		expect(course.modalityValue().value).toBe('online');
		expect(course.statusValue().value).toBe('active');
		expect(course.canRead()).toBe(true);
		expect(course.hasVisa()).toBe(false);
	});
});
