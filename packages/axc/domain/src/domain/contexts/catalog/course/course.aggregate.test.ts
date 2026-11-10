import { describe, expect, it } from 'vitest';
import { catalogReadVisa, systemCatalogPassport } from '../catalog.passport.ts';
import { Course } from './course.aggregate.ts';
import type { CourseModality, CourseProps, CourseStatus } from './course.entity.ts';

const validProps: CourseProps = {
	id: 'course-001',
	title: 'AI Security Foundations',
	summary: 'Introductory course on secure AI-assisted development.',
	modality: 'online',
	status: 'active',
	tags: ['ai', 'security'],
	createdAt: '2026-01-15T00:00:00.000Z',
	updatedAt: '2026-06-01T00:00:00.000Z',
};

describe('Course aggregate', () => {
	it('rehydrates a readable catalog course', () => {
		const course = Course.getNewInstance(validProps, systemCatalogPassport, catalogReadVisa);

		expect(course.id).toBe('course-001');
		expect(course.title).toBe('AI Security Foundations');
		expect(course.summary).toBe(validProps.summary);
		expect(course.modality).toBe('online');
		expect(course.status).toBe('active');
		expect(course.tags).toEqual(['ai', 'security']);
		expect(course.createdAt).toBe('2026-01-15T00:00:00.000Z');
		expect(course.updatedAt).toBe('2026-06-01T00:00:00.000Z');
		expect(course.canRead()).toBe(true);
	});

	it('accepts the in-person modality boundary', () => {
		const course = Course.getNewInstance({ ...validProps, modality: 'in-person' }, systemCatalogPassport, catalogReadVisa);

		expect(course.modality).toBe('in-person');
	});

	it('rejects a modality outside the catalog', () => {
		const props: CourseProps = { ...validProps, modality: 'classroom' as CourseModality };

		expect(() => Course.getNewInstance(props, systemCatalogPassport, catalogReadVisa)).toThrow(/modality/);
	});

	it('accepts the retired status boundary', () => {
		const course = Course.getNewInstance({ ...validProps, status: 'retired' }, systemCatalogPassport, catalogReadVisa);

		expect(course.status).toBe('retired');
	});

	it('rejects a status outside the catalog', () => {
		const props: CourseProps = { ...validProps, status: 'published' as CourseStatus };

		expect(() => Course.getNewInstance(props, systemCatalogPassport, catalogReadVisa)).toThrow(/status/);
	});
});
