import { expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

const props = { id: 'c', title: 'Course', summary: 'Summary', modality: 'online', status: 'active', tags: ['ai'], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
it('creates an independent course aggregate and defensively copies tags', () => {
	const course = Course.getNewInstance(props);
	props.tags.push('new');
	expect(course.tags).toEqual(['ai']);
	expect(course.id).toBe('c');
});
it.each([{ modality: 'bad' }, { status: 'bad' }, { title: '' }])('validates runtime factory input %s', (bad) => expect(() => Course.getNewInstance({ ...props, ...bad })).toThrow());
