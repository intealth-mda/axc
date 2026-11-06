import { InMemoryCourseRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { buildCourseService } from './courses.ts';
import { ServiceError } from './service-error.ts';

const search = buildCourseService(new InMemoryCourseRepository()).search;

describe('course search', () => {
	it('defaults to page 1 of 10 sorted by title', async () => {
		const result = await search({});
		expect(result).toMatchObject({ page: 1, pageSize: 10, totalItems: 12, totalPages: 2 });
		expect(result.items.map((c) => c.title)).toEqual(result.items.map((c) => c.title).sort((a, b) => a.localeCompare(b)));
	});

	it('matches q case-insensitively across title, summary and tags', async () => {
		const ids = (await search({ q: 'SeCuRiTy' })).items.map((c) => c.id);
		expect(ids).toEqual(expect.arrayContaining(['course-001', 'course-002', 'course-008', 'course-011']));
	});

	it('combines q, modality, status and tag filters', async () => {
		expect((await search({ q: 'security', modality: 'online', status: 'active' })).items.map((c) => c.id)).toEqual(['course-001']);
		expect((await search({ tag: 'AI', status: 'active' })).items.every((c) => c.tags.includes('ai'))).toBe(true);
	});

	it('paginates and sorts', async () => {
		const result = await search({ page: '3', pageSize: '5', sort: 'createdAt' });
		expect(result).toMatchObject({ page: 3, pageSize: 5, totalPages: 3 });
		expect(result.items).toHaveLength(2);
		const all = (await search({ pageSize: '50', sort: 'createdAt' })).items.map((c) => c.createdAt);
		expect(all).toEqual([...all].sort());
	});

	it('returns an empty page for no matches', async () => {
		expect(await search({ q: 'zzz' })).toEqual({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
	});

	it.each([{ modality: 'remote' }, { status: 'open' }, { page: '0' }, { page: 'x' }, { pageSize: '51' }, { sort: 'id' }])('rejects %j', async (query) => {
		const error = await search(query).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(ServiceError);
		expect(error).toMatchObject({ code: 'INVALID_QUERY_PARAMETER', details: [{ field: Object.keys(query)[0] }] });
	});
});
