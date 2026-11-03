import { InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { searchCourses } from './courses.ts';

const courses = { search: (q: Record<string, string>) => searchCourses(new InMemoryCourseRepository(), q) };

describe('searchCourses', () => {
	it('searches courses and rejects bad query parameters', async () => {
		const page = await courses.search({ q: 'security', sort: 'createdAt', pageSize: '1' });
		expect(page).toMatchObject({ page: 1, pageSize: 1, totalItems: 2, totalPages: 2 });
		expect(page.items[0]?.id).toBe('course-003');
		await expect(courses.search({ pageSize: '51', sort: 'x' })).rejects.toMatchObject({ code: 'INVALID_QUERY_PARAMETER', details: [{ field: 'sort' }, { field: 'pageSize' }] });
	});
});
