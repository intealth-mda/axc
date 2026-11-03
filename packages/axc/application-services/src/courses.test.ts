import { describe, expect, it } from 'vitest';
import { buildApplicationServicesFactory, type CourseQueryInput, type CourseSearchResult } from './index.ts';

const emptyQuery: CourseQueryInput = {
	q: undefined,
	modality: undefined,
	status: undefined,
	tag: undefined,
	page: undefined,
	pageSize: undefined,
	sort: undefined,
};

async function search(overrides: Partial<CourseQueryInput> = {}): Promise<CourseSearchResult> {
	const services = await buildApplicationServicesFactory({ environment: 'test' }).forRequest();
	return services.courses.search({ ...emptyQuery, ...overrides });
}

function pageOf(result: CourseSearchResult) {
	if (!result.ok) {
		throw new Error(result.error.error.details.map((detail) => `${detail.field}: ${detail.message}`).join('; '));
	}
	return result.page;
}

describe('course catalog search', () => {
	it('returns the first page sorted by title', async () => {
		const page = pageOf(await search());
		const titles = page.items.map((item) => item.title);

		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
		expect(page.totalItems).toBe(12);
		expect(page.totalPages).toBe(2);
		expect(titles).toEqual([...titles].sort());
		expect(page.items[0]).toMatchObject({
			id: 'course-001',
			title: 'AI Security Foundations',
			summary: 'Introductory course on secure AI-assisted development.',
			modality: 'online',
			status: 'active',
			tags: ['ai', 'security'],
			createdAt: '2026-01-15T00:00:00.000Z',
			updatedAt: '2026-06-01T00:00:00.000Z',
		});
	});

	it('seeds mixed modality, status, and tags', async () => {
		const items = pageOf(await search({ pageSize: '50' })).items;

		expect(items).toHaveLength(12);
		expect(new Set(items.map((item) => item.modality))).toEqual(new Set(['online', 'in-person', 'hybrid']));
		expect(new Set(items.map((item) => item.status))).toEqual(new Set(['draft', 'active', 'retired']));
		expect(items.some((item) => item.tags.length > 1)).toBe(true);
	});

	it('matches q across title, summary, and tags without case', async () => {
		const items = pageOf(await search({ q: 'SeCuRiTy', pageSize: '50' })).items;
		const inTitle = items.filter((item) => item.title.toLowerCase().includes('security'));
		const inSummaryOnly = items.filter((item) => !item.title.toLowerCase().includes('security') && item.summary.toLowerCase().includes('security'));
		const inTagOnly = items.filter((item) => !item.title.toLowerCase().includes('security') && !item.summary.toLowerCase().includes('security') && item.tags.some((tag) => tag.toLowerCase().includes('security')));

		expect(items).toHaveLength(3);
		expect(inTitle.length).toBeGreaterThan(0);
		expect(inSummaryOnly.length).toBeGreaterThan(0);
		expect(inTagOnly.length).toBeGreaterThan(0);
	});

	it('filters modality, status, and tag', async () => {
		const online = pageOf(await search({ modality: 'online', pageSize: '50' })).items;
		const active = pageOf(await search({ status: 'active', pageSize: '50' })).items;
		const tag = pageOf(await search({ tag: 'ai', pageSize: '50' })).items;
		const upperTag = pageOf(await search({ tag: 'AI', pageSize: '50' })).items;

		expect(online.length).toBeGreaterThan(0);
		expect(online.every((item) => item.modality === 'online')).toBe(true);
		expect(active.every((item) => item.status === 'active')).toBe(true);
		expect(tag.map((item) => item.id).sort()).toEqual(upperTag.map((item) => item.id).sort());
		expect(tag.some((item) => item.tags.includes('ai'))).toBe(true);
		expect(tag.some((item) => item.tags.includes('AI'))).toBe(true);
	});

	it('combines keyword, modality, and status', async () => {
		const items = pageOf(await search({ q: 'security', modality: 'online', status: 'active', pageSize: '50' })).items;

		expect(items.map((item) => item.id)).toEqual(['course-001']);
	});

	it('pages through matches', async () => {
		const page = pageOf(await search({ page: '2', pageSize: '5' }));

		expect(page.items).toHaveLength(5);
		expect(page.page).toBe(2);
		expect(page.pageSize).toBe(5);
		expect(page.totalItems).toBe(12);
		expect(page.totalPages).toBe(3);
		expect(page.items.map((item) => item.id)).toEqual(['course-005', 'course-003', 'course-009', 'course-012', 'course-008']);
	});

	it('sorts by createdAt and updatedAt', async () => {
		const byTitle = pageOf(await search({ pageSize: '50' })).items.map((item) => item.id);
		const byCreated = pageOf(await search({ sort: 'createdAt', pageSize: '50' })).items;
		const byUpdated = pageOf(await search({ sort: 'updatedAt', pageSize: '50' })).items;
		const createdAt = byCreated.map((item) => item.createdAt);
		const updatedAt = byUpdated.map((item) => item.updatedAt);

		expect(createdAt).toEqual([...createdAt].sort());
		expect(updatedAt).toEqual([...updatedAt].sort());
		expect(byCreated.map((item) => item.id)).not.toEqual(byTitle);
	});

	it('returns an empty page when nothing matches', async () => {
		const page = pageOf(await search({ q: 'zzznomatch' }));

		expect(page.items).toEqual([]);
		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
		expect(page.totalItems).toBe(0);
		expect(page.totalPages).toBe(0);
	});

	it.each([
		['modality', 'classroom', 'modality must be online, in-person, or hybrid.'],
		['status', 'published', 'status must be draft, active, or retired.'],
		['page', '0', 'page must be an integer greater than or equal to 1.'],
		['page', 'foo', 'page must be an integer greater than or equal to 1.'],
		['pageSize', '0', 'pageSize must be between 1 and 50.'],
		['pageSize', '51', 'pageSize must be between 1 and 50.'],
		['sort', 'popularity', 'sort must be title, createdAt, or updatedAt.'],
	] as const)('rejects invalid %s', async (field, value, message) => {
		const result = await search({ [field]: value });

		expect(result.ok).toBe(false);
		if (result.ok) {
			return;
		}
		expect(result.error).toEqual({
			error: {
				code: 'INVALID_QUERY_PARAMETER',
				message: 'One or more query parameters are invalid.',
				details: [{ field, message }],
			},
		});
	});

	it('collects every invalid query parameter', async () => {
		const result = await search({ modality: 'nope', status: 'nope', page: '0', pageSize: '51', sort: 'nope' });

		expect(result.ok).toBe(false);
		if (result.ok) {
			return;
		}
		expect(result.error.error.details.map((detail) => detail.field)).toEqual(['modality', 'status', 'page', 'pageSize', 'sort']);
	});
});
