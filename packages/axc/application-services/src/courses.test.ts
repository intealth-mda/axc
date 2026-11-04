import { describe, expect, it } from 'vitest';
import { buildApplicationServicesFactory, type CourseSearchInput, type CourseSearchResult } from './index.ts';

async function search(input: CourseSearchInput = {}): Promise<CourseSearchResult> {
	const services = await buildApplicationServicesFactory({ environment: 'test' }).forRequest();
	return services.courses.search(input);
}

function expectPage(result: CourseSearchResult) {
	expect(result.ok).toBe(true);
	if (!result.ok) {
		throw new Error(result.body.error.message);
	}
	return result.body;
}

async function expectInvalid(input: CourseSearchInput) {
	const result = await search(input);
	expect(result.ok).toBe(false);
	if (result.ok) {
		throw new Error('expected invalid query');
	}
	expect(result.body.error.code).toBe('INVALID_QUERY_PARAMETER');
	expect(result.body.error.message).toBe('One or more query parameters are invalid.');
	return result.body.error.details;
}

describe('course catalog search', () => {
	it('returns the default page sorted by title', async () => {
		const body = expectPage(await search());

		expect(body.page).toBe(1);
		expect(body.pageSize).toBe(10);
		expect(body.totalItems).toBe(12);
		expect(body.totalPages).toBe(2);
		expect(body.items.map((course) => course.id)).toEqual(['course-001', 'course-006', 'course-012', 'course-002', 'course-011', 'course-009', 'course-004', 'course-003', 'course-010', 'course-005']);
		expect(expectPage(await search({ page: '2' })).items.map((course) => course.id)).toEqual(['course-007', 'course-008']);
	});

	it('matches q across title, summary, and tags without case', async () => {
		const body = expectPage(await search({ q: 'SECURITY' }));

		expect(body.items.map((course) => course.id)).toEqual(['course-001', 'course-002', 'course-011', 'course-010']);
		expect(body.items.map((course) => course.id)).toContain('course-001');
		expect(body.items.map((course) => course.id)).toContain('course-010');
		expect(body.items.map((course) => course.id)).toContain('course-002');
	});

	it('filters by modality, status, and tag', async () => {
		expect(expectPage(await search({ modality: 'online' })).items.map((course) => course.id)).toEqual(['course-001', 'course-004', 'course-010', 'course-007']);
		expect(expectPage(await search({ modality: 'in-person' })).items.map((course) => course.id)).toEqual(['course-012', 'course-002', 'course-005', 'course-008']);
		expect(expectPage(await search({ modality: 'hybrid' })).items.map((course) => course.id)).toEqual(['course-006', 'course-011', 'course-009', 'course-003']);
		expect(expectPage(await search({ status: 'active' })).items.map((course) => course.id)).toEqual(['course-001', 'course-006', 'course-012', 'course-002', 'course-011', 'course-010']);
		expect(expectPage(await search({ status: 'draft' })).items.map((course) => course.id)).toEqual(['course-003', 'course-005', 'course-007']);
		expect(expectPage(await search({ status: 'retired' })).items.map((course) => course.id)).toEqual(['course-009', 'course-004', 'course-008']);
		expect(expectPage(await search({ tag: 'AI' })).items.map((course) => course.id)).toEqual(['course-001', 'course-006']);
	});

	it('combines q, modality, and status', async () => {
		expect(expectPage(await search({ q: 'security', modality: 'online', status: 'active' })).items.map((course) => course.id)).toEqual(['course-001', 'course-010']);
		expect(expectPage(await search({ q: 'security', modality: 'online', status: 'active', tag: 'ai', page: '1', pageSize: '5', sort: 'title' }))).toEqual({
			items: [
				{
					id: 'course-001',
					title: 'AI Security Foundations',
					summary: 'Introductory course on secure AI-assisted development.',
					modality: 'online',
					status: 'active',
					tags: ['ai', 'security'],
					createdAt: '2026-01-15T00:00:00.000Z',
					updatedAt: '2026-06-01T00:00:00.000Z',
				},
			],
			page: 1,
			pageSize: 5,
			totalItems: 1,
			totalPages: 1,
		});
	});

	it('paginates with page and pageSize', async () => {
		const body = expectPage(await search({ page: '1', pageSize: '5' }));

		expect(body.items).toHaveLength(5);
		expect(body.page).toBe(1);
		expect(body.pageSize).toBe(5);
		expect(body.totalItems).toBe(12);
		expect(body.totalPages).toBe(3);
		expect(body.items[0]?.id).toBe('course-001');
		expect(expectPage(await search({ page: '3', pageSize: '5' })).items.map((course) => course.id)).toEqual(['course-007', 'course-008']);
		expect(expectPage(await search({ pageSize: '50' })).items).toHaveLength(12);
	});

	it('sorts by createdAt', async () => {
		expect(expectPage(await search({ sort: 'createdAt', pageSize: '50' })).items.map((course) => course.id)).toEqual([
			'course-008',
			'course-009',
			'course-004',
			'course-001',
			'course-006',
			'course-002',
			'course-010',
			'course-003',
			'course-011',
			'course-005',
			'course-012',
			'course-007',
		]);
	});

	it('rejects invalid modality, status, page, pageSize, and sort', async () => {
		expect(await expectInvalid({ modality: 'remote' })).toEqual([{ field: 'modality', message: 'modality must be online, in-person, or hybrid.' }]);
		expect(await expectInvalid({ modality: 'ONLINE' })).toEqual([{ field: 'modality', message: 'modality must be online, in-person, or hybrid.' }]);
		expect(await expectInvalid({ status: 'published' })).toEqual([{ field: 'status', message: 'status must be draft, active, or retired.' }]);
		expect(await expectInvalid({ page: '0' })).toEqual([{ field: 'page', message: 'page must be an integer greater than or equal to 1.' }]);
		expect(await expectInvalid({ page: 'foo' })).toEqual([{ field: 'page', message: 'page must be an integer greater than or equal to 1.' }]);
		expect(await expectInvalid({ pageSize: '0' })).toEqual([{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' }]);
		expect(await expectInvalid({ pageSize: '51' })).toEqual([{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' }]);
		expect(await expectInvalid({ pageSize: 'abc' })).toEqual([{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' }]);
		expect(await expectInvalid({ sort: 'name' })).toEqual([{ field: 'sort', message: 'sort must be title, createdAt, or updatedAt.' }]);
		expect(await expectInvalid({ modality: 'nope', pageSize: '100' })).toEqual([
			{ field: 'modality', message: 'modality must be online, in-person, or hybrid.' },
			{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' },
		]);
	});

	it('returns an empty page when nothing matches', async () => {
		expect(expectPage(await search({ q: 'zzzz-no-course' }))).toEqual({
			items: [],
			page: 1,
			pageSize: 10,
			totalItems: 0,
			totalPages: 0,
		});
	});
});
