import { describe, expect, it } from 'vitest';
import { buildApplicationServicesFactory } from '../../../index.ts';
import { InvalidCourseQueryError } from './query-courses.ts';

async function search(query: Readonly<Record<string, readonly string[]>> = {}) {
	const services = await buildApplicationServicesFactory({ environment: 'test' }).forRequest();
	return services.course.searchCourses(query);
}

async function rejection(query: Readonly<Record<string, readonly string[]>>) {
	const services = await buildApplicationServicesFactory({ environment: 'test' }).forRequest();
	try {
		await services.course.searchCourses(query);
	} catch (error) {
		return error;
	}
	throw new Error('expected InvalidCourseQueryError');
}

function fieldsOf(error: unknown): Set<string> {
	expect(error).toBeInstanceOf(InvalidCourseQueryError);
	const details = (error as InvalidCourseQueryError).details;
	return new Set(details.map((detail) => detail.field));
}

describe('course catalog search', () => {
	it('returns the default page sorted by title', async () => {
		const page = await search();

		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
		expect(page.totalItems).toBe(12);
		expect(page.totalPages).toBe(2);
		expect(page.items).toHaveLength(10);
		expect(page.items[0]?.id).toBe('course-007');
		expect(page.items[9]?.id).toBe('course-009');
	});

	it('matches q across title, summary, and tags regardless of case', async () => {
		const page = await search({ q: ['SeCuRiTy'] });
		const ids = page.items.map((item) => item.id);

		expect(ids).toEqual(['course-001', 'course-002', 'course-012', 'course-011']);
		expect(await search({ q: ['Foundations'] })).toMatchObject({ items: [{ id: 'course-001' }], totalItems: 1 });
		expect(await search({ q: ['practical security drills'] })).toMatchObject({ items: [{ id: 'course-002' }], totalItems: 1 });
		expect(await search({ q: ['finops'] })).toMatchObject({ items: [{ id: 'course-006' }], totalItems: 1 });
	});

	it('filters modality, status, and tag', async () => {
		const online = await search({ modality: ['online'] });
		expect(online.totalItems).toBe(5);
		expect(online.items.every((item) => item.modality === 'online')).toBe(true);

		const active = await search({ status: ['active'] });
		expect(active.totalItems).toBe(6);
		expect(active.items.every((item) => item.status === 'active')).toBe(true);

		const ai = await search({ tag: ['ai'] });
		expect(ai.items.map((item) => item.id)).toEqual(['course-007', 'course-001']);
	});

	it('combines q, modality, and status', async () => {
		const page = await search({ q: ['security'], modality: ['online'], status: ['active'] });
		expect(page.items.map((item) => item.id)).toEqual(['course-001', 'course-012']);
		expect(page.totalItems).toBe(2);
	});

	it('combines modality and status', async () => {
		const page = await search({ modality: ['hybrid'], status: ['draft'] });
		expect(page.items.map((item) => item.id)).toEqual(['course-003']);
	});

	it('paginates with page and pageSize', async () => {
		const page = await search({ page: ['1'], pageSize: ['5'] });
		expect(page.items).toHaveLength(5);
		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(5);
		expect(page.totalItems).toBe(12);
		expect(page.totalPages).toBe(3);

		const second = await search({ page: ['2'], pageSize: ['10'] });
		expect(second.items.map((item) => item.id)).toEqual(['course-012', 'course-011']);
		expect(second.totalPages).toBe(2);
	});

	it('sorts by createdAt ascending', async () => {
		const page = await search({ sort: ['createdAt'], pageSize: ['50'] });
		expect(page.items.map((item) => item.id)[0]).toBe('course-005');
		const createdAt = page.items.map((item) => item.createdAt);
		expect([...createdAt].sort()).toEqual(createdAt);
		expect(page.items).toHaveLength(12);
	});

	it('returns an empty list when nothing matches', async () => {
		const page = await search({ q: ['zzzz-no-such-course'] });
		expect(page).toEqual({
			items: [],
			page: 1,
			pageSize: 10,
			totalItems: 0,
			totalPages: 0,
		});
	});

	it('accepts the page boundary of 1', async () => {
		const page = await search({ page: ['1'] });
		expect(page.page).toBe(1);
		expect(page.totalItems).toBe(12);
	});

	it('rejects a page below 1', async () => {
		const error = await rejection({ page: ['0'] });
		expect(fieldsOf(error)).toEqual(new Set(['page']));
		expect((error as InvalidCourseQueryError).details[0]?.message).toBe('page must be an integer greater than or equal to 1.');
	});

	it('accepts pageSize boundaries 1 and 50', async () => {
		const smallest = await search({ pageSize: ['1'] });
		expect(smallest.pageSize).toBe(1);
		expect(smallest.items).toHaveLength(1);
		expect(smallest.totalPages).toBe(12);

		const largest = await search({ pageSize: ['50'] });
		expect(largest.pageSize).toBe(50);
		expect(largest.items).toHaveLength(12);
		expect(largest.totalPages).toBe(1);
	});

	it('rejects pageSize outside 1 to 50', async () => {
		const tooSmall = await rejection({ pageSize: ['0'] });
		const tooLarge = await rejection({ pageSize: ['51'] });
		expect(fieldsOf(tooSmall)).toEqual(new Set(['pageSize']));
		expect(fieldsOf(tooLarge)).toEqual(new Set(['pageSize']));
		expect((tooLarge as InvalidCourseQueryError).details[0]?.message).toBe('pageSize must be between 1 and 50.');
	});

	it('accepts each modality', async () => {
		expect((await search({ modality: ['online'] })).totalItems).toBe(5);
		expect((await search({ modality: ['in-person'] })).totalItems).toBe(4);
		expect((await search({ modality: ['hybrid'] })).totalItems).toBe(3);
	});

	it('rejects an unknown modality', async () => {
		const error = await rejection({ modality: ['remote'] });
		expect(fieldsOf(error)).toEqual(new Set(['modality']));
	});

	it('accepts each status', async () => {
		expect((await search({ status: ['draft'] })).totalItems).toBe(3);
		expect((await search({ status: ['active'] })).totalItems).toBe(6);
		expect((await search({ status: ['retired'] })).totalItems).toBe(3);
	});

	it('rejects an unknown status', async () => {
		const error = await rejection({ status: ['published'] });
		expect(fieldsOf(error)).toEqual(new Set(['status']));
	});

	it('accepts each sort field', async () => {
		expect((await search({ sort: ['title'] })).items[0]?.id).toBe('course-007');
		expect((await search({ sort: ['createdAt'] })).items[0]?.id).toBe('course-005');
		expect((await search({ sort: ['updatedAt'] })).items[0]?.id).toBe('course-005');
	});

	it('rejects an unknown sort', async () => {
		const error = await rejection({ sort: ['rank'] });
		expect(fieldsOf(error)).toEqual(new Set(['sort']));
	});

	it('reports every invalid field without depending on order', async () => {
		const error = await rejection({
			modality: ['nope'],
			status: ['nope'],
			page: ['0'],
			pageSize: ['51'],
			sort: ['rank'],
		});
		expect(fieldsOf(error)).toEqual(new Set(['modality', 'status', 'page', 'pageSize', 'sort']));
	});
});
