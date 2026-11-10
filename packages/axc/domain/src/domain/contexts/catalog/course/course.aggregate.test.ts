import type { Visa } from '@cellix/domain-seedwork/visa';
import { describe, expect, it } from 'vitest';
import { CatalogPassport, type CatalogReadPermissions } from '../catalog.passport.ts';
import { Course } from './course.aggregate.ts';
import type { CourseProps } from './course.entity.ts';

const props: CourseProps = {
	id: 'course-001',
	title: 'AI Security Foundations',
	summary: 'Introductory course on secure AI-assisted development.',
	modality: 'online',
	status: 'active',
	tags: ['ai', 'security'],
	createdAt: '2026-01-15T00:00:00.000Z',
	updatedAt: '2026-06-01T00:00:00.000Z',
};

const allowVisa: Visa<CatalogReadPermissions> = {
	determineIf(func) {
		return func({ canReadCatalog: true });
	},
};

const denyVisa: Visa<CatalogReadPermissions> = {
	determineIf(func) {
		return func({ canReadCatalog: false });
	},
};

describe('Course aggregate', () => {
	it('exposes catalog fields for an allowed reader', () => {
		const course = Course.getNewInstance(props, new CatalogPassport(), allowVisa);

		expect(course.id).toBe('course-001');
		expect(course.title).toBe('AI Security Foundations');
		expect(course.summary).toContain('secure AI-assisted');
		expect(course.modality).toBe('online');
		expect(course.status).toBe('active');
		expect(course.tags).toEqual(['ai', 'security']);
		expect(course.createdAt).toBe('2026-01-15T00:00:00.000Z');
		expect(course.updatedAt).toBe('2026-06-01T00:00:00.000Z');
	});

	it('rejects a reader without catalog permission', () => {
		expect(() => Course.getNewInstance(props, new CatalogPassport('denied'), denyVisa)).toThrow('Catalog read is not permitted.');
	});
});
