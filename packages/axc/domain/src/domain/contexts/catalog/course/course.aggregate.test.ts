import { describe, expect, it } from 'vitest';
import { Course, type CourseProps } from './course.aggregate.ts';

const props: CourseProps = { id: 'c1', title: 'T', summary: 'S', modality: 'online', status: 'active', tags: ['ai'], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' };

describe('Course', () => {
	it('creates from valid props', () => {
		const course = Course.getNewInstance(props);
		expect(course.toReference()).toEqual(props);
		expect([course.id, course.title, course.summary, course.modality, course.status, course.tags, course.createdAt, course.updatedAt]).toEqual(Object.values(props));
	});
	it.each([{ title: ' ' }, { modality: 'x' }, { status: 'x' }])('rejects %o', (bad) => {
		expect(() => Course.getNewInstance({ ...props, ...bad } as CourseProps)).toThrow();
	});
});
