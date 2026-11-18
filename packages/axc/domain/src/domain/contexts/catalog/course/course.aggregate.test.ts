import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

describe('Course', () => {
	it('creates with id and timestamps passed in', () => {
		const c = Course.getNewInstance('c1', { title: ' T ', summary: 's', modality: 'online', status: 'draft', tags: ['AI'] }, '2026-01-01T00:00:00.000Z');
		expect([c.id, c.title, c.summary, c.modality, c.status, c.tags, c.createdAt, c.updatedAt]).toEqual(['c1', 'T', 's', 'online', 'draft', ['ai'], '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z']);
	});
});
