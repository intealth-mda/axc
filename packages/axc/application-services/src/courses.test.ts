import { courseSeed, InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { coursesService } from './courses.ts';

const svc = coursesService(new InMemoryCourseRepository(courseSeed));

describe('coursesService.list', () => {
	it('combines q, modality and status', async () => {
		const r = await svc.list({ q: 'SECURITY', modality: 'online', status: 'active' });
		expect(r.items.map((c) => c.id)).toEqual(['course-001', 'course-007']);
	});
	it('reports every invalid field', async () => {
		await expect(svc.list({ modality: 'x', status: 'y', page: '0', pageSize: '51', sort: 'id' })).rejects.toMatchObject({
			code: 'INVALID_QUERY_PARAMETER',
			details: ['modality', 'status', 'page', 'pageSize', 'sort'].map((field) => expect.objectContaining({ field })),
		});
	});
});
