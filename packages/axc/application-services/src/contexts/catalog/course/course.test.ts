import { describe, expect, it } from 'vitest';
import { buildApplicationServicesFactory, parseCourseQuery } from '../../../index.ts';

function idsOf(items: readonly { id: string }[]): string[] {
	return items.map((item) => item.id);
}

function detailFields(raw: Parameters<typeof parseCourseQuery>[0]): string[] {
	const parsed = parseCourseQuery(raw);
	if (parsed.ok) {
		return [];
	}
	return parsed.error.error.details.map((detail) => detail.field).sort();
}

describe('course catalog query', () => {
	it('defaults page, pageSize, and sort', () => {
		const parsed = parseCourseQuery({});
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) {
			return;
		}
		expect(parsed.query).toEqual({ page: 1, pageSize: 10, sort: 'title' });
	});

	it('accepts boundary values for modality, status, page, pageSize, and sort', () => {
		const parsed = parseCourseQuery({ modality: 'hybrid', status: 'retired', page: '1', pageSize: '50', sort: 'updatedAt' });
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) {
			return;
		}
		expect(parsed.query.modality).toBe('hybrid');
		expect(parsed.query.status).toBe('retired');
		expect(parsed.query.page).toBe(1);
		expect(parsed.query.pageSize).toBe(50);
		expect(parsed.query.sort).toBe('updatedAt');
	});

	it('accepts each allowed modality, status, and sort', () => {
		expect(parseCourseQuery({ modality: 'online' }).ok).toBe(true);
		expect(parseCourseQuery({ modality: 'in-person' }).ok).toBe(true);
		expect(parseCourseQuery({ status: 'draft' }).ok).toBe(true);
		expect(parseCourseQuery({ status: 'active' }).ok).toBe(true);
		expect(parseCourseQuery({ pageSize: '1' }).ok).toBe(true);
		expect(parseCourseQuery({ sort: 'title' }).ok).toBe(true);
		expect(parseCourseQuery({ sort: 'createdAt' }).ok).toBe(true);
	});

	it('rejects an invalid modality', () => {
		const parsed = parseCourseQuery({ modality: 'remote' });
		expect(parsed.ok).toBe(false);
		if (parsed.ok) {
			return;
		}
		expect(parsed.error.error.code).toBe('INVALID_QUERY_PARAMETER');
		expect(parsed.error.error.message).toBe('One or more query parameters are invalid.');
		expect(detailFields({ modality: 'remote' })).toEqual(['modality']);
	});

	it('rejects an invalid status', () => {
		expect(detailFields({ status: 'published' })).toEqual(['status']);
	});

	it('rejects an invalid page', () => {
		expect(detailFields({ page: '0' })).toEqual(['page']);
		expect(detailFields({ page: 'abc' })).toEqual(['page']);
	});

	it('rejects an invalid pageSize', () => {
		const parsed = parseCourseQuery({ pageSize: '51' });
		expect(parsed.ok).toBe(false);
		if (parsed.ok) {
			return;
		}
		expect(parsed.error.error.details).toEqual([{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' }]);
		expect(detailFields({ pageSize: '0' })).toEqual(['pageSize']);
		expect(detailFields({ pageSize: '10.5' })).toEqual(['pageSize']);
	});

	it('rejects an invalid sort', () => {
		expect(detailFields({ sort: 'rank' })).toEqual(['sort']);
	});

	it('reports every invalid field without depending on order', () => {
		expect(detailFields({ modality: 'remote', status: 'published', page: '0', pageSize: '51', sort: 'rank' })).toEqual(['modality', 'page', 'pageSize', 'sort', 'status']);
	});
});

describe('course catalog search', () => {
	async function search(raw: Parameters<typeof parseCourseQuery>[0]) {
		const parsed = parseCourseQuery(raw);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) {
			throw new Error('expected a valid course query');
		}
		const services = await buildApplicationServicesFactory({ environment: 'test' }).forRequest();
		return services.course.findCourses(parsed.query);
	}

	it('returns the default page sorted by title', async () => {
		const page = await search({});
		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
		expect(page.totalItems).toBe(14);
		expect(page.totalPages).toBe(2);
		expect(idsOf(page.items)).toEqual(['course-001', 'course-010', 'course-004', 'course-007', 'course-003', 'course-011', 'course-006', 'course-009', 'course-012', 'course-002']);
	});

	it('matches a keyword across title, summary, and tags regardless of case', async () => {
		const page = await search({ q: 'SeCuRiTy' });
		expect(idsOf(page.items).sort()).toEqual(['course-001', 'course-002', 'course-008', 'course-009', 'course-013']);
		const byId = new Map(page.items.map((item) => [item.id, item]));
		expect(byId.get('course-001')?.title.toLowerCase()).toContain('security');
		expect(byId.get('course-008')?.summary.toLowerCase()).toContain('security');
		expect(byId.get('course-009')?.tags.some((tag) => tag.toLowerCase().includes('security'))).toBe(true);
	});

	it('filters by modality, status, and tag', async () => {
		const online = await search({ modality: 'online' });
		expect(online.items.every((item) => item.modality === 'online')).toBe(true);
		expect(idsOf(online.items).sort()).toEqual(['course-001', 'course-004', 'course-005', 'course-008', 'course-012']);

		const active = await search({ status: 'active' });
		expect(active.items.every((item) => item.status === 'active')).toBe(true);
		expect(idsOf(active.items).sort()).toEqual(['course-001', 'course-002', 'course-007', 'course-008', 'course-010', 'course-013', 'course-014']);

		const tagged = await search({ tag: 'AI' });
		expect(idsOf(tagged.items).sort()).toEqual(['course-001', 'course-004', 'course-007']);
	});

	it('combines keyword, modality, and status', async () => {
		const page = await search({ q: 'security', modality: 'online', status: 'active' });
		expect(idsOf(page.items).sort()).toEqual(['course-001', 'course-008']);
	});

	it('paginates with page and pageSize', async () => {
		const page = await search({ page: '1', pageSize: '5' });
		expect(page.items).toHaveLength(5);
		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(5);
		expect(page.totalItems).toBe(14);
		expect(page.totalPages).toBe(3);

		const second = await search({ page: '2', pageSize: '10' });
		expect(idsOf(second.items)).toEqual(['course-008', 'course-005', 'course-013', 'course-014']);
	});

	it('sorts by createdAt and updatedAt', async () => {
		const byCreated = await search({ sort: 'createdAt' });
		const createdAt = byCreated.items.map((item) => item.createdAt);
		expect(byCreated.items[0]?.id).toBe('course-005');
		expect([...createdAt].sort()).toEqual(createdAt);

		const byUpdated = await search({ sort: 'updatedAt', pageSize: '14' });
		expect(byUpdated.items[0]?.id).toBe('course-014');
		const updatedAt = byUpdated.items.map((item) => item.updatedAt);
		expect([...updatedAt].sort()).toEqual(updatedAt);
	});

	it('returns an empty page when nothing matches', async () => {
		const page = await search({ q: 'zzzz-no-course' });
		expect(page.items).toEqual([]);
		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
		expect(page.totalItems).toBe(0);
		expect(page.totalPages).toBe(0);
	});
});
