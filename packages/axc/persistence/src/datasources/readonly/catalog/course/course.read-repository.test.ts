import { describe, expect, it } from 'vitest';
import { courses } from '../../../../seed/catalog/course.ts';
import { courseReadRepository } from './course.read-repository.ts';

const repo = courseReadRepository(courses);
const query = { page: 1, pageSize: 50, sort: 'title' };
describe('course catalog search', () => {
	it('contains twelve complete unique fixtures with mixed values', () => {
		expect(courses).toHaveLength(12);
		expect(new Set(courses.map((c) => c.id)).size).toBe(12);
		expect(new Set(courses.map((c) => c.modality)).size).toBe(3);
		expect(new Set(courses.map((c) => c.status)).size).toBe(3);
		for (const c of courses) {
			expect(c.title.length).toBeGreaterThan(0);
			expect(c.summary.length).toBeGreaterThan(0);
			expect(c.tags.length).toBeGreaterThan(0);
			expect(new Date(c.createdAt).toISOString()).toBe(c.createdAt);
			expect(new Date(c.updatedAt).toISOString()).toBe(c.updatedAt);
		}
	});
	it('matches keyword in title, summary and tags case insensitively', async () => {
		expect((await repo.search({ ...query, q: 'SeCuRiTy' })).items.map((c) => c.id)).toEqual(['course-001', 'course-002', 'course-007', 'course-009']);
	});
	it.each(['online', 'in-person', 'hybrid'])('filters modality %s', async (modality) => {
		const result = await repo.search({ ...query, modality });
		expect(result.totalItems).toBe(4);
		expect(result.items.every((c) => c.modality === modality)).toBe(true);
	});
	it.each(['active', 'draft', 'retired'])('filters status %s', async (status) => {
		const result = await repo.search({ ...query, status });
		expect(result.totalItems).toBe(4);
		expect(result.items.every((c) => c.status === status)).toBe(true);
	});
	it('matches whole tags ignoring case', async () => {
		expect((await repo.search({ ...query, tag: 'AI' })).items.map((c) => c.id)).toEqual(['course-001', 'course-002']);
		expect((await repo.search({ ...query, tag: 'secur' })).totalItems).toBe(0);
	});
	it('combines keyword modality and status', async () => {
		expect((await repo.search({ ...query, q: 'security', modality: 'online', status: 'active' })).items.map((c) => c.id)).toEqual(['course-001', 'course-007']);
	});
	it('combines tag and modality', async () => {
		expect((await repo.search({ ...query, tag: 'ai', modality: 'in-person' })).items.map((c) => c.id)).toEqual(['course-002']);
	});
	it('paginates after filtering with exact totals', async () => {
		const first = await repo.search({ ...query, pageSize: 5 });
		const second = await repo.search({ ...query, page: 2, pageSize: 5 });
		expect(first).toMatchObject({ page: 1, pageSize: 5, totalItems: 12, totalPages: 3 });
		expect(first.items).toHaveLength(5);
		expect(second.items.map((c) => c.id)).toEqual(['course-006', 'course-007', 'course-008', 'course-009', 'course-010']);
		expect((await repo.search({ ...query, page: 4, pageSize: 5 })).items).toEqual([]);
	});
	it.each(['title', 'createdAt', 'updatedAt'] as const)('sorts ascending by %s', async (sort) => {
		const result = await repo.search({ ...query, sort });
		expect(result.items.map((c) => c[sort])).toEqual(courses.map((c) => c[sort]).sort((a, b) => a.localeCompare(b)));
		expect(result.items).toHaveLength(12);
	});
	it('breaks ties by id and returns copies', async () => {
		const source = courses[0];
		if (!source) throw new Error('Missing fixture');
		const tied = courseReadRepository([
			{ ...source, id: 'b' },
			{ ...source, id: 'a' },
		]);
		const result = await tied.search(query);
		expect(result.items.map((c) => c.id)).toEqual(['a', 'b']);
		Object.assign(result.items[0]?.tags ?? [], { 0: 'changed' });
		Object.assign(result.items[0] ?? {}, { title: 'changed' });
		expect((await tied.search(query)).items[0]).toMatchObject({ title: source.title, tags: source.tags });
	});
	it('returns no matches with zero pages', async () => {
		expect(await repo.search({ ...query, q: 'zzzz-no-match' })).toEqual({ items: [], page: 1, pageSize: 50, totalItems: 0, totalPages: 0 });
	});
});
