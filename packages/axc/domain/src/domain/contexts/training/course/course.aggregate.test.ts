import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

const props = { id: 'c', title: 'Security', summary: 'Training', modality: 'online' as const, status: 'active' as const, tags: ['ai'], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
describe('Course aggregate', () => {
	it('creates a valid aggregate and protects input tags', () => {
		const course = Course.getNewInstance(props);
		props.tags.push('new');
		expect(course.tags).toEqual(['ai']);
		expect(course.id).toBe('c');
		expect(course.title).toBe('Security');
		expect(course.summary).toBe('Training');
		expect(course.modality).toBe('online');
		expect(course.status).toBe('active');
		expect(course.createdAt).toBe(course.updatedAt);
	});
	it.each([{ modality: 'bad' }, { status: 'bad' }, { title: '' }, { summary: '' }, { id: '' }, { tags: [2] }, { createdAt: 'bad' }])('rejects invalid creation %j', (overrides) => {
		expect(() => Course.getNewInstance({ ...props, ...overrides } as never)).toThrow();
	});
});
