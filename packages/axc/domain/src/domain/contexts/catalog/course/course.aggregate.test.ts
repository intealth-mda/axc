import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';
import type { CourseProps } from './course.entity.ts';
import type { CoursePassport } from './course.passport.ts';
import { CourseModalityValue, CourseStatusValue } from './course.value-objects.ts';

const passport: CoursePassport = { kind: 'course-catalog' };

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

describe('Course aggregate', () => {
	it('creates a course from validated props', () => {
		const course = Course.getNewInstance(props, passport);

		expect(course.id).toBe('course-001');
		expect(course.props.title).toBe('AI Security Foundations');
		expect(course.props.modality).toBe('online');
		expect(course.props.status).toBe('active');
		expect(course.props.tags).toEqual(['ai', 'security']);
		expect(course.props.tags).not.toBe(props.tags);
	});

	it('rejects an unknown modality', () => {
		expect(() => CourseModalityValue.from('remote')).toThrow(/Invalid modality/);
	});

	it('rejects an unknown status', () => {
		expect(() => CourseStatusValue.from('archived')).toThrow(/Invalid status/);
	});
});
