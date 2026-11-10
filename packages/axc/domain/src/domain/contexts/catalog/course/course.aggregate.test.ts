import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';
import { InvalidCourseTitleError } from './course.value-objects.ts';

const input = { title: ' Intro ', summary: 's', modality: 'online', status: 'active', tags: ['ai'] } as const;

describe('Course', () => {
	it('creates with given id and timestamps', () => {
		const ref = Course.getNewInstance('c1', input, '2026-01-01T00:00:00.000Z').toReference();
		expect(ref).toEqual({ id: 'c1', title: 'Intro', summary: 's', modality: 'online', status: 'active', tags: ['ai'], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
	});
	it('rejects blank title', () => {
		expect(() => Course.getNewInstance('c1', { ...input, title: ' ' }, 'now')).toThrow(InvalidCourseTitleError);
	});
});
