import { describe, expect, it } from 'vitest';
import { COURSE_FIXTURES } from './course-fixtures.ts';
import { searchCourses } from './courses.ts';
import { buildApplicationServicesFactory } from './index.ts';

describe('ApplicationServices.courses', () => {
	it('searches the course fixtures with the given query', async () => {
		const services = await buildApplicationServicesFactory({ environment: 'test' }).forRequest();

		expect(services.courses.search({ q: 'security', modality: 'online', status: 'active' })).toEqual(searchCourses({ q: 'security', modality: 'online', status: 'active' }, COURSE_FIXTURES));
	});

	it('returns the default first page of all fixtures for an empty query', async () => {
		const services = await buildApplicationServicesFactory({ environment: 'test' }).forRequest();
		const result = services.courses.search({});

		expect(result.ok).toBe(true);
		expect(result.ok && result.value.totalItems).toBe(COURSE_FIXTURES.length);
		expect(result.ok && result.value.items).toHaveLength(10);
	});

	it('returns the validation error for invalid input', async () => {
		const services = await buildApplicationServicesFactory({ environment: 'test' }).forRequest();

		expect(services.courses.search({ pageSize: '51' })).toEqual({
			ok: false,
			error: {
				code: 'INVALID_QUERY_PARAMETER',
				message: 'One or more query parameters are invalid.',
				details: [{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' }],
			},
		});
	});
});
