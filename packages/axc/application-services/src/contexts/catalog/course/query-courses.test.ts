import { describe, expect, it } from 'vitest';
import { buildApplicationServicesFactory } from '../../../index.ts';
import { type CoursePage, InvalidCourseQueryError, type RawCourseQuery } from './query-courses.ts';

async function search(raw: RawCourseQuery): Promise<CoursePage> {
	const services = await buildApplicationServicesFactory({ environment: 'test' }).forRequest();
	return services.course.search(raw);
}

async function searchError(raw: RawCourseQuery): Promise<InvalidCourseQueryError> {
	try {
		await search(raw);
	} catch (error) {
		expect(error).toBeInstanceOf(InvalidCourseQueryError);
		return error as InvalidCourseQueryError;
	}
	throw new Error('expected invalid query');
}

function fieldsOf(error: InvalidCourseQueryError): Set<string> {
	return new Set(error.details.map((detail) => detail.field));
}

describe('course catalog search', () => {
	it('returns the default page sorted by title', async () => {
		const page = await search({});

		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
		expect(page.totalItems).toBe(12);
		expect(page.totalPages).toBe(2);
		expect(page.items.map((item) => item.id)).toEqual(['course-009', 'course-007', 'course-001', 'course-005', 'course-010', 'course-006', 'course-011', 'course-003', 'course-008', 'course-012']);
	});

	it('matches a keyword in title, summary, or tags regardless of case', async () => {
		const page = await search({ q: 'SeCuRiTy' });
		expect(page.totalItems).toBe(3);
		expect(page.items.map((item) => item.id).sort()).toEqual(['course-001', 'course-005', 'course-008']);

		const titleOnly = await search({ q: 'facilitation' });
		expect(titleOnly.items.map((item) => item.id)).toEqual(['course-002']);

		const summaryOnly = await search({ q: 'principles' });
		expect(summaryOnly.items.map((item) => item.id)).toEqual(['course-006']);

		const tagOnly = await search({ q: 'A11Y' });
		expect(tagOnly.items.map((item) => item.id)).toEqual(['course-009']);
	});

	it('filters by modality, status, and tag', async () => {
		const online = await search({ modality: 'online', pageSize: '50' });
		expect(online.totalItems).toBe(5);
		expect(online.items.every((item) => item.modality === 'online')).toBe(true);

		const active = await search({ status: 'active', pageSize: '50' });
		expect(active.totalItems).toBe(6);
		expect(active.items.every((item) => item.status === 'active')).toBe(true);

		const tagged = await search({ tag: 'AI' });
		expect(tagged.items.map((item) => item.id).sort()).toEqual(['course-001', 'course-007']);

		const partialTag = await search({ tag: 'lead' });
		expect(partialTag.totalItems).toBe(0);
	});

	it('combines keyword, modality, and status filters', async () => {
		const onlineActive = await search({ q: 'security', modality: 'online', status: 'active' });
		expect(onlineActive.totalItems).toBe(1);
		expect(onlineActive.items[0]).toMatchObject({ id: 'course-001' });

		const retiredRoom = await search({ q: 'security', modality: 'in-person', status: 'retired' });
		expect(retiredRoom.totalItems).toBe(1);
		expect(retiredRoom.items[0]).toMatchObject({ id: 'course-008' });
	});

	it('paginates with page and pageSize metadata', async () => {
		const first = await search({ page: '1', pageSize: '5' });
		expect(first.items).toHaveLength(5);
		expect(first.page).toBe(1);
		expect(first.pageSize).toBe(5);
		expect(first.totalItems).toBe(12);
		expect(first.totalPages).toBe(3);

		const second = await search({ page: '2', pageSize: '10' });
		expect(second.items.map((item) => item.id)).toEqual(['course-004', 'course-002']);
		expect(second.totalPages).toBe(2);

		const pastEnd = await search({ page: '3', pageSize: '10' });
		expect(pastEnd.items).toEqual([]);
		expect(pastEnd.page).toBe(3);
		expect(pastEnd.totalItems).toBe(12);
		expect(pastEnd.totalPages).toBe(2);
	});

	it('sorts by createdAt and updatedAt', async () => {
		const byCreated = await search({ sort: 'createdAt', pageSize: '50' });
		expect(byCreated.items.map((item) => item.id)[0]).toBe('course-008');
		const createdStamps = byCreated.items.map((item) => item.createdAt);
		expect([...createdStamps].sort()).toEqual(createdStamps);

		const byUpdated = await search({ sort: 'updatedAt', pageSize: '50' });
		expect(byUpdated.items.map((item) => item.id)[0]).toBe('course-004');
	});

	it('accepts the page and pageSize boundaries', async () => {
		const smallest = await search({ page: '1', pageSize: '1' });
		expect(smallest.items).toHaveLength(1);
		expect(smallest.pageSize).toBe(1);
		expect(smallest.totalPages).toBe(12);

		const largest = await search({ pageSize: '50' });
		expect(largest.items).toHaveLength(12);
		expect(largest.pageSize).toBe(50);
		expect(largest.totalPages).toBe(1);
	});

	it('rejects each invalid query parameter', async () => {
		expect(fieldsOf(await searchError({ modality: 'remote' }))).toEqual(new Set(['modality']));
		expect(fieldsOf(await searchError({ status: 'paused' }))).toEqual(new Set(['status']));
		expect(fieldsOf(await searchError({ page: '0' }))).toEqual(new Set(['page']));
		expect(fieldsOf(await searchError({ page: 'abc' }))).toEqual(new Set(['page']));
		expect(fieldsOf(await searchError({ pageSize: '0' }))).toEqual(new Set(['pageSize']));
		expect(fieldsOf(await searchError({ pageSize: '51' }))).toEqual(new Set(['pageSize']));
		expect(fieldsOf(await searchError({ pageSize: '10.5' }))).toEqual(new Set(['pageSize']));
		expect(fieldsOf(await searchError({ sort: 'rating' }))).toEqual(new Set(['sort']));
		expect(fieldsOf(await searchError({ tag: '   ' }))).toEqual(new Set(['tag']));

		const combined = await searchError({
			modality: 'remote',
			status: 'paused',
			page: '0',
			pageSize: '51',
			sort: 'rating',
		});
		expect(fieldsOf(combined)).toEqual(new Set(['modality', 'status', 'page', 'pageSize', 'sort']));
		expect(combined.details.find((detail) => detail.field === 'pageSize')?.message).toBe('pageSize must be between 1 and 50.');
	});

	it('returns an empty page when nothing matches', async () => {
		const page = await search({ q: 'zzzz-no-such-course' });
		expect(page.items).toEqual([]);
		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
		expect(page.totalItems).toBe(0);
		expect(page.totalPages).toBe(0);
	});
});
