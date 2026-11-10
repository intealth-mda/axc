import { describe, expect, it } from 'vitest';
import { buildApplicationServicesFactory, type CourseQueryInput, type CourseQueryOutcome } from './index.ts';

async function query(input: CourseQueryInput): Promise<CourseQueryOutcome> {
	const services = await buildApplicationServicesFactory({ environment: 'test' }).forRequest();
	return await services.course.query(input);
}

function pageOf(outcome: CourseQueryOutcome) {
	if (!outcome.ok) {
		throw new Error('expected a catalog page');
	}
	return outcome.result;
}

function errorOf(outcome: CourseQueryOutcome) {
	if (outcome.ok) {
		throw new Error('expected a query error');
	}
	return outcome.error;
}

describe('course catalog search', () => {
	it('returns the default page sorted by title', async () => {
		const result = pageOf(await query({}));

		expect(result.page).toBe(1);
		expect(result.pageSize).toBe(10);
		expect(result.totalItems).toBe(12);
		expect(result.totalPages).toBe(2);
		expect(result.items).toHaveLength(10);
		expect(result.items[0]).toEqual({
			id: 'course-009',
			title: 'AI Ethics for Practitioners',
			summary: 'Apply ethics reviews to AI-enabled products.',
			modality: 'online',
			status: 'active',
			tags: ['ai', 'ethics'],
			createdAt: '2026-05-01T00:00:00.000Z',
			updatedAt: '2026-07-01T00:00:00.000Z',
		});
	});

	it('seeds mixed modality, status, and tags', async () => {
		const result = pageOf(await query({ pageSize: '50' }));
		const modalities = new Set(result.items.map((item) => item.modality));
		const statuses = new Set(result.items.map((item) => item.status));

		expect(result.totalItems).toBe(12);
		expect(modalities).toEqual(new Set(['online', 'in-person', 'hybrid']));
		expect(statuses).toEqual(new Set(['draft', 'active', 'retired']));
		expect(result.items.some((item) => item.tags.length > 1)).toBe(true);
	});

	it('matches a keyword in title, summary, or tags regardless of case', async () => {
		const result = pageOf(await query({ q: 'SeCuRiTy' }));

		expect(result.items.map((item) => item.id).sort()).toEqual(['course-001', 'course-002', 'course-003', 'course-004']);
		expect(result.totalItems).toBe(4);
	});

	it('filters by modality', async () => {
		const result = pageOf(await query({ modality: 'online' }));

		expect(result.totalItems).toBe(5);
		expect(result.items.every((item) => item.modality === 'online')).toBe(true);
	});

	it('filters by status', async () => {
		const result = pageOf(await query({ status: 'active' }));

		expect(result.totalItems).toBe(6);
		expect(result.items.every((item) => item.status === 'active')).toBe(true);
	});

	it('filters by tag regardless of case', async () => {
		const result = pageOf(await query({ tag: 'AI' }));

		expect(result.items.map((item) => item.id)).toEqual(['course-009', 'course-001']);
	});

	it('combines keyword, modality, and status', async () => {
		const result = pageOf(await query({ q: 'security', modality: 'online', status: 'active' }));

		expect(result.totalItems).toBe(1);
		expect(result.items.map((item) => item.id)).toEqual(['course-001']);
	});

	it('combines modality and tag', async () => {
		const result = pageOf(await query({ modality: 'online', tag: 'ai' }));

		expect(result.items.map((item) => item.id)).toEqual(['course-009', 'course-001']);
	});

	it('paginates with page and pageSize', async () => {
		const result = pageOf(await query({ page: '2', pageSize: '5' }));

		expect(result.page).toBe(2);
		expect(result.pageSize).toBe(5);
		expect(result.totalItems).toBe(12);
		expect(result.totalPages).toBe(3);
		expect(result.items).toHaveLength(5);
		expect(result.items.map((item) => item.id)).toEqual(['course-006', 'course-003', 'course-010', 'course-002', 'course-012']);
	});

	it('sorts by createdAt ascending', async () => {
		const result = pageOf(await query({ sort: 'createdAt', pageSize: '50' }));
		const dates = result.items.map((item) => item.createdAt);
		const sorted = [...dates].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));

		expect(result.items.map((item) => item.id).slice(0, 3)).toEqual(['course-011', 'course-008', 'course-010']);
		expect(dates).toEqual(sorted);
	});

	it('sorts by updatedAt ascending', async () => {
		const result = pageOf(await query({ sort: 'updatedAt', pageSize: '50' }));

		expect(result.items[0]?.id).toBe('course-008');
		expect(result.items[1]?.id).toBe('course-010');
	});

	it('returns an empty page when nothing matches', async () => {
		const result = pageOf(await query({ q: 'zzznomatch' }));

		expect(result.items).toEqual([]);
		expect(result.page).toBe(1);
		expect(result.pageSize).toBe(10);
		expect(result.totalItems).toBe(0);
		expect(result.totalPages).toBe(0);
	});

	it('accepts the modality boundary value in-person', async () => {
		const result = pageOf(await query({ modality: ' in-person ' }));

		expect(result.totalItems).toBe(4);
		expect(result.items.every((item) => item.modality === 'in-person')).toBe(true);
	});

	it('rejects an invalid modality', async () => {
		const error = errorOf(await query({ modality: 'remote' }));

		expect(error.details).toEqual([{ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' }]);
	});

	it('accepts the status boundary value retired', async () => {
		const result = pageOf(await query({ status: 'retired' }));

		expect(result.totalItems).toBe(3);
		expect(result.items.every((item) => item.status === 'retired')).toBe(true);
	});

	it('rejects an invalid status', async () => {
		const error = errorOf(await query({ status: 'published' }));

		expect(error.details).toEqual([{ field: 'status', message: 'status must be one of draft, active, retired.' }]);
	});

	it('accepts the page boundary value 1', async () => {
		const result = pageOf(await query({ page: '1' }));

		expect(result.page).toBe(1);
		expect(result.items).toHaveLength(10);
	});

	it('rejects page 0', async () => {
		const error = errorOf(await query({ page: '0' }));

		expect(error.details).toEqual([{ field: 'page', message: 'page must be an integer greater than or equal to 1.' }]);
	});

	it('rejects a non-numeric page', async () => {
		const error = errorOf(await query({ page: 'abc' }));

		expect(error.code).toBe('INVALID_QUERY_PARAMETER');
		expect(error.details.map((detail) => detail.field)).toEqual(['page']);
	});

	it('accepts the pageSize boundary value 1', async () => {
		const result = pageOf(await query({ pageSize: '1' }));

		expect(result.pageSize).toBe(1);
		expect(result.items).toHaveLength(1);
		expect(result.totalPages).toBe(12);
	});

	it('accepts the pageSize boundary value 50', async () => {
		const result = pageOf(await query({ pageSize: '50' }));

		expect(result.pageSize).toBe(50);
		expect(result.items).toHaveLength(12);
		expect(result.totalPages).toBe(1);
	});

	it('rejects pageSize 0', async () => {
		const error = errorOf(await query({ pageSize: '0' }));

		expect(error.details).toEqual([{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' }]);
	});

	it('rejects pageSize above 50', async () => {
		const error = errorOf(await query({ pageSize: '51' }));

		expect(error.message).toBe('One or more query parameters are invalid.');
		expect(error.details).toEqual([{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' }]);
	});

	it('rejects a non-numeric pageSize', async () => {
		const error = errorOf(await query({ pageSize: 'abc' }));

		expect(error.details.map((detail) => detail.field)).toEqual(['pageSize']);
	});

	it('accepts the sort boundary value updatedAt', async () => {
		const result = pageOf(await query({ sort: 'updatedAt' }));

		expect(result.items[0]?.id).toBe('course-008');
	});

	it('rejects an invalid sort', async () => {
		const error = errorOf(await query({ sort: 'rank' }));

		expect(error.details).toEqual([{ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' }]);
	});

	it('reports every invalid query field together', async () => {
		const error = errorOf(await query({ modality: 'remote', status: 'published', page: '0', pageSize: '51', sort: 'rank' }));

		expect(error.code).toBe('INVALID_QUERY_PARAMETER');
		expect(error.details.map((detail) => detail.field).sort()).toEqual(['modality', 'page', 'pageSize', 'sort', 'status']);
	});
});
