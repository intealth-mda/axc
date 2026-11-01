import { describe, expect, it } from 'vitest';
import { type Course, searchCourses } from './courses.ts';
import { buildApplicationServicesFactory, type CourseSearchResult, parseCourseQuery } from './index.ts';

const PAGE_SIZE_MESSAGE = 'pageSize must be between 1 and 50.';

// Parse raw query params and run them through the real application service.
async function search(raw: Record<string, string | undefined>): Promise<CourseSearchResult> {
	const parsed = parseCourseQuery(raw);
	if (!parsed.ok) {
		throw new Error(`unexpected validation errors: ${JSON.stringify(parsed.errors)}`);
	}
	const services = await buildApplicationServicesFactory({ environment: 'test' }).forRequest();
	return services.courses.search(parsed.query);
}

const ids = (result: CourseSearchResult) => result.items.map((course) => course.id);

function errorFields(raw: Record<string, string | undefined>): string[] {
	const parsed = parseCourseQuery(raw);
	if (parsed.ok) {
		throw new Error('expected validation errors');
	}
	return parsed.errors.map((error) => error.field);
}

function errorsFor(raw: Record<string, string | undefined>) {
	const parsed = parseCourseQuery(raw);
	if (parsed.ok) {
		throw new Error('expected validation errors');
	}
	return parsed.errors;
}

describe('parseCourseQuery', () => {
	it('applies defaults page 1, pageSize 10, sort title when no params are given', () => {
		expect(parseCourseQuery({})).toEqual({ ok: true, query: { page: 1, pageSize: 10, sort: 'title' } });
	});

	it('parses every supported parameter when all are valid', () => {
		expect(parseCourseQuery({ q: 'security', modality: 'online', status: 'active', tag: 'ai', page: '2', pageSize: '5', sort: 'createdAt' })).toEqual({
			ok: true,
			query: { q: 'security', modality: 'online', status: 'active', tag: 'ai', page: 2, pageSize: 5, sort: 'createdAt' },
		});
	});

	it('ignores unknown parameters', () => {
		expect(parseCourseQuery({ foo: 'bar' })).toEqual({ ok: true, query: { page: 1, pageSize: 10, sort: 'title' } });
	});

	it.each(['online', 'in-person', 'hybrid'])('accepts modality %s', (modality) => {
		expect(parseCourseQuery({ modality }).ok).toBe(true);
	});

	it.each(['draft', 'active', 'retired'])('accepts status %s', (status) => {
		expect(parseCourseQuery({ status }).ok).toBe(true);
	});

	it.each(['title', 'createdAt', 'updatedAt'])('accepts sort %s', (sort) => {
		expect(parseCourseQuery({ sort }).ok).toBe(true);
	});

	it.each(['1', '50'])('accepts pageSize boundary %s', (pageSize) => {
		expect(parseCourseQuery({ pageSize })).toMatchObject({ ok: true, query: { pageSize: Number(pageSize) } });
	});

	it('accepts page 1 as the minimum page', () => {
		expect(parseCourseQuery({ page: '1' })).toMatchObject({ ok: true, query: { page: 1 } });
	});

	it.each(['0', '-1', '1.5', 'abc'])('rejects page %s with a page error', (page) => {
		expect(errorFields({ page })).toEqual(['page']);
	});

	it.each(['0', '-5', '2.5', '51', 'abc'])('rejects pageSize %s with the exact pageSize message', (pageSize) => {
		expect(errorsFor({ pageSize })).toEqual([{ field: 'pageSize', message: PAGE_SIZE_MESSAGE }]);
	});

	it('rejects an unknown modality', () => {
		expect(errorFields({ modality: 'virtual' })).toEqual(['modality']);
	});

	it('rejects an unknown status', () => {
		expect(errorFields({ status: 'archived' })).toEqual(['status']);
	});

	it('rejects an unknown sort', () => {
		expect(errorFields({ sort: 'price' })).toEqual(['sort']);
	});

	it('gives every error a non-empty message', () => {
		for (const error of errorsFor({ page: '0', modality: 'x', status: 'y', sort: 'z' })) {
			expect(error.message.length).toBeGreaterThan(0);
		}
	});

	it('collects one error per invalid field in a single result', () => {
		expect(errorFields({ page: '0', pageSize: '51', modality: 'x', status: 'y', sort: 'z' }).sort()).toEqual(['modality', 'page', 'pageSize', 'sort', 'status']);
	});
});

describe('courses.search', () => {
	it('returns the first page of 10 courses sorted by title by default', async () => {
		const result = await search({});
		expect(result).toMatchObject({ page: 1, pageSize: 10, totalItems: 14, totalPages: 2 });
		expect(ids(result)).toEqual(['course-009', 'course-007', 'course-001', 'course-002', 'course-003', 'course-010', 'course-012', 'course-006', 'course-005', 'course-004']);
	});

	it('returns full course records', async () => {
		const result = await search({ q: 'AI Security Foundations' });
		expect(result.items).toEqual([
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
		]);
	});

	it('matches q against title, summary, and tags', async () => {
		// course-001 matches by title, course-003 by tag only, course-005 by summary only
		expect(ids(await search({ q: 'security' }))).toEqual(['course-001', 'course-003', 'course-005']);
	});

	it.each(['SECURITY', 'Security', 'sEcUrItY'])('matches q case-insensitively (%s)', async (q) => {
		expect(ids(await search({ q }))).toEqual(['course-001', 'course-003', 'course-005']);
	});

	it('matches q as a substring of a tag', async () => {
		expect(ids(await search({ q: 'mlop' }))).toEqual(['course-006']);
	});

	it.each(['', '   '])('treats empty q %j as absent', async (q) => {
		expect((await search({ q })).totalItems).toBe(14);
	});

	it('filters by modality', async () => {
		const result = await search({ modality: 'online' });
		expect(result.totalItems).toBe(5);
		expect(ids(result)).toEqual(['course-009', 'course-007', 'course-001', 'course-013', 'course-008']);
	});

	it('filters by status', async () => {
		const result = await search({ status: 'active' });
		expect(result.totalItems).toBe(6);
		expect(ids(result)).toEqual(['course-001', 'course-002', 'course-012', 'course-006', 'course-005', 'course-008']);
	});

	it('filters by tag', async () => {
		expect(ids(await search({ tag: 'ai' }))).toEqual(['course-001', 'course-006', 'course-004', 'course-013']);
	});

	it('matches tag case-insensitively', async () => {
		expect(ids(await search({ tag: 'AI' }))).toEqual(['course-001', 'course-006', 'course-004', 'course-013']);
	});

	it('matches tag exactly, not as a substring', async () => {
		expect((await search({ tag: 'secur' })).items).toEqual([]);
	});

	it.each(['', '   '])('treats empty tag %j as absent', async (tag) => {
		expect((await search({ tag })).totalItems).toBe(14);
	});

	it('combines q, modality, and status filters', async () => {
		const result = await search({ q: 'security', modality: 'online', status: 'active' });
		expect(result).toMatchObject({ page: 1, pageSize: 10, totalItems: 1, totalPages: 1 });
		expect(ids(result)).toEqual(['course-001']);
	});

	it('combines modality and status filters', async () => {
		expect(ids(await search({ modality: 'hybrid', status: 'active' }))).toEqual(['course-012', 'course-006']);
	});

	it('combines tag and status filters', async () => {
		expect(ids(await search({ tag: 'ai', status: 'draft' }))).toEqual(['course-004', 'course-013']);
	});

	it('returns the requested page with pagination metadata', async () => {
		const result = await search({ page: '2', pageSize: '5' });
		expect(result).toMatchObject({ page: 2, pageSize: 5, totalItems: 14, totalPages: 3 });
		expect(ids(result)).toEqual(['course-010', 'course-012', 'course-006', 'course-005', 'course-004']);
	});

	it('returns a partial last page', async () => {
		const result = await search({ page: '3', pageSize: '5' });
		expect(result).toMatchObject({ page: 3, pageSize: 5, totalItems: 14, totalPages: 3 });
		expect(ids(result)).toEqual(['course-013', 'course-014', 'course-011', 'course-008']);
	});

	it('returns all courses on one page when pageSize is 50', async () => {
		const result = await search({ pageSize: '50' });
		expect(result).toMatchObject({ page: 1, pageSize: 50, totalItems: 14, totalPages: 1 });
		expect(result.items).toHaveLength(14);
	});

	it('returns one course per page when pageSize is 1', async () => {
		const result = await search({ pageSize: '1' });
		expect(result).toMatchObject({ totalItems: 14, totalPages: 14 });
		expect(ids(result)).toEqual(['course-009']);
	});

	it('returns empty items with metadata for a page past the end', async () => {
		expect(await search({ page: '4', pageSize: '5' })).toEqual({ items: [], page: 4, pageSize: 5, totalItems: 14, totalPages: 3 });
	});

	it('sorts by createdAt ascending', async () => {
		expect(ids(await search({ sort: 'createdAt' }))).toEqual(['course-007', 'course-003', 'course-011', 'course-001', 'course-005', 'course-002', 'course-014', 'course-006', 'course-009', 'course-008']);
	});

	it('sorts by updatedAt ascending', async () => {
		expect(ids(await search({ sort: 'updatedAt' }))).toEqual(['course-004', 'course-009', 'course-007', 'course-003', 'course-010', 'course-013', 'course-006', 'course-014', 'course-002', 'course-011']);
	});

	it('returns an empty result with valid metadata when nothing matches', async () => {
		expect(await search({ q: 'zzz' })).toEqual({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
	});
});

describe('searchCourses tie-break', () => {
	const course = (id: string, title: string, createdAt: string): Course => ({
		id,
		title,
		summary: 'summary',
		modality: 'online',
		status: 'active',
		tags: [],
		createdAt,
		updatedAt: createdAt,
	});
	const ties = [course('c-3', 'Same', '2026-01-01T00:00:00.000Z'), course('c-1', 'Same', '2026-01-01T00:00:00.000Z'), course('c-2', 'Same', '2026-01-01T00:00:00.000Z')];

	it.each(['title', 'createdAt', 'updatedAt'] as const)('breaks %s ties by id ascending', (sort) => {
		const result = searchCourses(ties, { page: 1, pageSize: 10, sort });
		expect(result.items.map((c) => c.id)).toEqual(['c-1', 'c-2', 'c-3']);
	});
});
