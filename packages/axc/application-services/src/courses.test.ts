import { describe, expect, it } from 'vitest';
import { buildApplicationServicesFactory, type CourseSearchResult } from './index.ts';

async function search(query: Record<string, string | string[]>): Promise<CourseSearchResult> {
	const services = await buildApplicationServicesFactory({ environment: 'test' }).forRequest();
	return services.courses.search(query);
}

function pageOf(result: CourseSearchResult) {
	expect(result.ok).toBe(true);
	if (!result.ok) {
		throw new Error('expected a course page');
	}
	return result.page;
}

describe('course catalog search', () => {
	it('returns the default first page sorted by title', async () => {
		const page = pageOf(await search({}));

		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
		expect(page.totalItems).toBe(12);
		expect(page.totalPages).toBe(2);
		expect(page.items).toHaveLength(10);
		expect(page.items[0]).toEqual({
			id: 'course-001',
			title: 'AI Security Foundations',
			summary: 'Introductory course on secure AI-assisted development.',
			modality: 'online',
			status: 'active',
			tags: ['ai', 'security'],
			createdAt: '2026-01-15T00:00:00.000Z',
			updatedAt: '2026-06-01T00:00:00.000Z',
		});
		expect(page.items.map((item) => item.id)).toEqual(['course-001', 'course-006', 'course-007', 'course-004', 'course-005', 'course-010', 'course-003', 'course-012', 'course-009', 'course-011']);
	});

	it('matches q across title, summary, and tags regardless of case', async () => {
		expect(pageOf(await search({ q: 'FOUNDATIONS' })).items.map((item) => item.id)).toEqual(['course-001']);
		expect(pageOf(await search({ q: 'PACKET' })).items.map((item) => item.id)).toEqual(['course-012']);
		expect(pageOf(await search({ q: 'TEACHING' })).items.map((item) => item.id)).toEqual(['course-006']);
		expect(pageOf(await search({ q: 'SECURITY' })).items.map((item) => item.id)).toEqual(['course-001', 'course-007', 'course-012', 'course-011', 'course-002']);
	});

	it('filters by modality, status, and tag', async () => {
		const online = pageOf(await search({ modality: 'online' }));
		expect(online.totalItems).toBe(5);
		expect(online.items.every((item) => item.modality === 'online')).toBe(true);

		const active = pageOf(await search({ status: 'active' }));
		expect(active.totalItems).toBe(7);
		expect(active.items.every((item) => item.status === 'active')).toBe(true);

		const tagged = pageOf(await search({ tag: 'AI' }));
		expect(tagged.items.map((item) => item.id)).toEqual(['course-001', 'course-005', 'course-010']);
		expect(pageOf(await search({ tag: 'a' })).items).toEqual([]);
	});

	it('combines q, modality, and status', async () => {
		const page = pageOf(await search({ q: 'security', modality: 'online', status: 'active' }));

		expect(page.items.map((item) => item.title)).toEqual(['AI Security Foundations', 'Threat Modeling']);
		expect(page.totalItems).toBe(2);
	});

	it('paginates with page and pageSize', async () => {
		const first = pageOf(await search({ page: '1', pageSize: '5' }));
		const second = pageOf(await search({ page: '2', pageSize: '5' }));
		const third = pageOf(await search({ page: '3', pageSize: '5' }));

		expect(first.items).toHaveLength(5);
		expect(second.items).toHaveLength(5);
		expect(third.items).toHaveLength(2);
		expect(first.totalItems).toBe(12);
		expect(first.totalPages).toBe(3);
		expect(new Set([...first.items, ...second.items, ...third.items].map((item) => item.id)).size).toBe(12);

		const lastDefaultPage = pageOf(await search({ page: '2' }));
		expect(lastDefaultPage.page).toBe(2);
		expect(lastDefaultPage.pageSize).toBe(10);
		expect(lastDefaultPage.items.map((item) => item.id)).toEqual(['course-002', 'course-008']);

		const wide = pageOf(await search({ pageSize: '50' }));
		expect(wide.pageSize).toBe(50);
		expect(wide.totalPages).toBe(1);
		expect(wide.items).toHaveLength(12);

		const pastEnd = pageOf(await search({ page: '5' }));
		expect(pastEnd.items).toEqual([]);
		expect(pastEnd.page).toBe(5);
		expect(pastEnd.totalItems).toBe(12);
		expect(pastEnd.totalPages).toBe(2);
	});

	it('sorts by createdAt and updatedAt', async () => {
		const byCreated = pageOf(await search({ sort: 'createdAt', pageSize: '50' }));
		expect(byCreated.items.map((item) => item.id)).toEqual(['course-009', 'course-004', 'course-002', 'course-001', 'course-003', 'course-006', 'course-008', 'course-007', 'course-005', 'course-010', 'course-011', 'course-012']);

		const byUpdated = pageOf(await search({ sort: 'updatedAt', pageSize: '50' }));
		expect(byUpdated.items.map((item) => item.id)).toEqual(['course-009', 'course-004', 'course-002', 'course-006', 'course-003', 'course-005', 'course-010', 'course-001', 'course-007', 'course-011', 'course-012', 'course-008']);
	});

	it('rejects invalid modality, status, page, pageSize, and sort', async () => {
		const pageSize = await search({ pageSize: '51' });
		expect(pageSize).toEqual({
			ok: false,
			error: {
				error: {
					code: 'INVALID_QUERY_PARAMETER',
					message: 'One or more query parameters are invalid.',
					details: [{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' }],
				},
			},
		});

		expect(await search({ modality: 'classroom' })).toMatchObject({ ok: false });
		expect(await search({ status: 'archived' })).toMatchObject({ ok: false });
		expect(await search({ page: '0' })).toMatchObject({ ok: false });
		expect(await search({ page: '1.5' })).toMatchObject({ ok: false });
		expect(await search({ pageSize: '0' })).toMatchObject({ ok: false });
		expect(await search({ sort: 'TITLE' })).toMatchObject({ ok: false });

		const combined = await search({ extra: '1', modality: 'nope', page: '0', pageSize: '51', sort: 'rank' });
		expect(combined.ok).toBe(false);
		if (combined.ok) {
			return;
		}
		expect(combined.error.error.details).toEqual([
			{ field: 'extra', message: 'Unknown query parameter "extra".' },
			{ field: 'modality', message: 'modality must be online, in-person, or hybrid.' },
			{ field: 'page', message: 'page must be an integer greater than or equal to 1.' },
			{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' },
			{ field: 'sort', message: 'sort must be title, createdAt, or updatedAt.' },
		]);
	});

	it('returns an empty page when nothing matches', async () => {
		expect(pageOf(await search({ q: 'zzzz-no-such-course' }))).toEqual({
			items: [],
			page: 1,
			pageSize: 10,
			totalItems: 0,
			totalPages: 0,
		});
	});
});
