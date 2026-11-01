import { describe, expect, it } from 'vitest';
import { COURSE_SEED } from './course-seed.ts';
import { type Course, type CoursePage, type CourseSearchParams, type QueryParameterError, searchCourses } from './courses.ts';
import { buildApplicationServicesFactory } from './index.ts';

function search(params: CourseSearchParams, courses: readonly Course[] = COURSE_SEED): CoursePage {
	const result = searchCourses(courses, params);
	if (!result.ok) {
		throw new Error(`expected ok, got errors ${JSON.stringify(result.errors)}`);
	}
	return result.value;
}

function searchErrors(params: CourseSearchParams): QueryParameterError[] {
	const result = searchCourses(COURSE_SEED, params);
	if (result.ok) {
		throw new Error(`expected errors, got ok ${JSON.stringify(result.value)}`);
	}
	return result.errors;
}

const ids = (page: CoursePage) => page.items.map((course) => course.id);

// Seed ids in the order of each sort key (see course-seed.ts).
const BY_TITLE = ['course-008', 'course-001', 'course-011', 'course-002', 'course-009', 'course-004', 'course-012', 'course-010', 'course-007', 'course-006', 'course-013', 'course-014', 'course-003', 'course-005'];
const BY_CREATED_AT = ['course-010', 'course-014', 'course-005', 'course-012', 'course-007', 'course-013', 'course-002', 'course-001', 'course-006', 'course-003', 'course-008', 'course-004', 'course-009', 'course-011'];
const BY_UPDATED_AT = ['course-010', 'course-005', 'course-014', 'course-012', 'course-013', 'course-002', 'course-003', 'course-008', 'course-007', 'course-004', 'course-001', 'course-009', 'course-006', 'course-011'];

describe('course seed', () => {
	it('has at least 12 courses with unique ids', () => {
		expect(COURSE_SEED.length).toBeGreaterThanOrEqual(12);
		expect(new Set(COURSE_SEED.map((course) => course.id)).size).toBe(COURSE_SEED.length);
	});

	it('covers every modality and every status', () => {
		expect(new Set(COURSE_SEED.map((course) => course.modality))).toEqual(new Set(['online', 'in-person', 'hybrid']));
		expect(new Set(COURSE_SEED.map((course) => course.status))).toEqual(new Set(['draft', 'active', 'retired']));
	});
});

describe('searchCourses defaults', () => {
	it('returns page 1 of 10 items sorted by title with total metadata when no params are given', () => {
		const page = search({});

		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
		expect(page.totalItems).toBe(14);
		expect(page.totalPages).toBe(2);
		expect(ids(page)).toEqual(BY_TITLE.slice(0, 10));
	});

	it('returns full course objects', () => {
		const page = search({ q: 'AI Security Foundations' });

		expect(page.items).toEqual([COURSE_SEED.find((course) => course.id === 'course-001')]);
	});
});

describe('searchCourses keyword q', () => {
	it('matches security in title, summary, or tags regardless of case', () => {
		// 002 title only, 003 and 004 summary only, 005 and 013 tag only.
		expect(ids(search({ q: 'security' }))).toEqual(['course-001', 'course-002', 'course-004', 'course-013', 'course-003', 'course-005']);
	});

	it('is case-insensitive in the query itself', () => {
		expect(ids(search({ q: 'SeCuRiTy' }))).toEqual(ids(search({ q: 'security' })));
	});

	it('matches a summary-only phrase', () => {
		expect(ids(search({ q: 'batch jobs' }))).toEqual(['course-010']);
	});

	it('matches a tag-only value', () => {
		expect(ids(search({ q: 'MLOPS' }))).toEqual(['course-007']);
	});

	it('treats a blank q as no filter', () => {
		expect(search({ q: '   ' }).totalItems).toBe(14);
	});
});

describe('searchCourses filters', () => {
	it('modality=online returns only online courses', () => {
		const page = search({ modality: 'online', pageSize: '50' });

		expect(ids(page)).toEqual(['course-001', 'course-009', 'course-004', 'course-012', 'course-006', 'course-014', 'course-005']);
		expect(page.items.every((course) => course.modality === 'online')).toBe(true);
	});

	it('modality=in-person and modality=hybrid are accepted', () => {
		expect(ids(search({ modality: 'in-person' }))).toEqual(['course-008', 'course-010', 'course-013', 'course-003']);
		expect(ids(search({ modality: 'hybrid' }))).toEqual(['course-011', 'course-002', 'course-007']);
	});

	it('status=active returns only active courses', () => {
		const page = search({ status: 'active', pageSize: '50' });

		expect(ids(page)).toEqual(['course-008', 'course-001', 'course-002', 'course-012', 'course-007', 'course-006', 'course-013', 'course-003']);
		expect(page.items.every((course) => course.status === 'active')).toBe(true);
	});

	it('status=draft and status=retired are accepted', () => {
		expect(ids(search({ status: 'draft' }))).toEqual(['course-011', 'course-009', 'course-004']);
		expect(ids(search({ status: 'retired' }))).toEqual(['course-010', 'course-014', 'course-005']);
	});

	it('tag=ai returns courses with the ai tag, including one stored as AI', () => {
		expect(ids(search({ tag: 'ai' }))).toEqual(['course-001', 'course-011', 'course-007', 'course-006']);
	});

	it('tag matching is case-insensitive in the request', () => {
		expect(ids(search({ tag: 'AI' }))).toEqual(['course-001', 'course-011', 'course-007', 'course-006']);
		expect(ids(search({ tag: 'security' }))).toEqual(['course-001', 'course-013', 'course-005']);
	});

	it('tag matches a whole tag, not a substring of one', () => {
		expect(search({ tag: 'a' }).totalItems).toBe(0);
	});
});

describe('searchCourses combined filters', () => {
	it('q + modality + status narrows to the intersection', () => {
		expect(ids(search({ q: 'security', modality: 'online', status: 'active' }))).toEqual(['course-001']);
	});

	it('returns the exact API contract example for q, modality, status, tag, page, pageSize, and sort', () => {
		const page = search({ q: 'security', modality: 'online', status: 'active', tag: 'ai', page: '1', pageSize: '5', sort: 'title' });

		expect(page).toEqual({
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

	it('modality + tag narrows to the intersection', () => {
		expect(ids(search({ modality: 'hybrid', tag: 'ai' }))).toEqual(['course-011', 'course-007']);
	});

	it('status + modality narrows to the intersection', () => {
		expect(ids(search({ status: 'draft', modality: 'online' }))).toEqual(['course-009', 'course-004']);
	});
});

describe('searchCourses pagination', () => {
	it('page=1&pageSize=5 returns 5 items and pagination metadata', () => {
		const page = search({ page: '1', pageSize: '5' });

		expect(ids(page)).toEqual(BY_TITLE.slice(0, 5));
		expect(page).toMatchObject({ page: 1, pageSize: 5, totalItems: 14, totalPages: 3 });
	});

	it('page=2 returns the next slice', () => {
		const page = search({ page: '2' });

		expect(ids(page)).toEqual(BY_TITLE.slice(10));
		expect(page).toMatchObject({ page: 2, pageSize: 10, totalItems: 14, totalPages: 2 });
	});

	it('a page past the end returns 200-style ok with no items and the real totals', () => {
		const page = search({ page: '3' });

		expect(page).toEqual({ items: [], page: 3, pageSize: 10, totalItems: 14, totalPages: 2 });
	});

	it('pageSize=50 (the maximum) returns every course on one page', () => {
		const page = search({ pageSize: '50' });

		expect(ids(page)).toEqual(BY_TITLE);
		expect(page).toMatchObject({ page: 1, pageSize: 50, totalItems: 14, totalPages: 1 });
	});

	it('pageSize=1 (the minimum) is accepted', () => {
		const page = search({ pageSize: '1' });

		expect(ids(page)).toEqual(['course-008']);
		expect(page).toMatchObject({ pageSize: 1, totalPages: 14 });
	});
});

describe('searchCourses sorting', () => {
	it('sort=title sorts ascending by title', () => {
		expect(ids(search({ sort: 'title', pageSize: '50' }))).toEqual(BY_TITLE);
	});

	it('sort=createdAt sorts ascending by createdAt', () => {
		expect(ids(search({ sort: 'createdAt', pageSize: '50' }))).toEqual(BY_CREATED_AT);
	});

	it('sort=updatedAt sorts ascending by updatedAt', () => {
		expect(ids(search({ sort: 'updatedAt', pageSize: '50' }))).toEqual(BY_UPDATED_AT);
	});

	it('sorts before paginating', () => {
		expect(ids(search({ sort: 'createdAt', page: '2', pageSize: '5' }))).toEqual(BY_CREATED_AT.slice(5, 10));
	});

	it('breaks ties by id', () => {
		const base = COURSE_SEED[0] as Course;
		const courses: Course[] = [
			{ ...base, id: 'course-b', title: 'Same' },
			{ ...base, id: 'course-a', title: 'Same' },
		];

		expect(ids(search({}, courses))).toEqual(['course-a', 'course-b']);
	});

	it('rejects an unknown sort value instead of silently falling back', () => {
		expect(searchErrors({ sort: 'priority' }).map((error) => error.field)).toEqual(['sort']);
	});

	it('rejects a sort value with the wrong case', () => {
		expect(searchErrors({ sort: 'CREATEDAT' }).map((error) => error.field)).toEqual(['sort']);
	});
});

describe('searchCourses validation', () => {
	it.each(['remote', 'Online', ''])('rejects modality=%j', (modality) => {
		const errors = searchErrors({ modality });

		expect(errors).toEqual([{ field: 'modality', message: expect.any(String) }]);
		expect(errors[0]?.message).not.toBe('');
	});

	it.each(['archived', 'ACTIVE', ''])('rejects status=%j', (status) => {
		const errors = searchErrors({ status });

		expect(errors).toEqual([{ field: 'status', message: expect.any(String) }]);
		expect(errors[0]?.message).not.toBe('');
	});

	it.each(['0', '-1', 'abc', '1.5', ''])('rejects page=%j with the positive-integer message', (page) => {
		expect(searchErrors({ page })).toEqual([{ field: 'page', message: 'page must be a positive integer.' }]);
	});

	it.each(['0', '51', 'abc', '1.5', ''])('rejects pageSize=%j with the 1-50 message', (pageSize) => {
		expect(searchErrors({ pageSize })).toEqual([{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' }]);
	});

	it('rejects an empty tag', () => {
		const errors = searchErrors({ tag: '' });

		expect(errors).toEqual([{ field: 'tag', message: expect.any(String) }]);
		expect(errors[0]?.message).not.toBe('');
	});

	it('reports one detail per invalid field when several are invalid', () => {
		const errors = searchErrors({ modality: 'remote', status: 'archived', page: '0', pageSize: '51', sort: 'priority', q: 'security' });

		expect(errors.map((error) => error.field).sort()).toEqual(['modality', 'page', 'pageSize', 'sort', 'status']);
		expect(errors).toContainEqual({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		expect(errors).toContainEqual({ field: 'page', message: 'page must be a positive integer.' });
	});
});

describe('searchCourses no match', () => {
	it('returns ok with empty items and zero totals', () => {
		const result = searchCourses(COURSE_SEED, { q: 'no-such-course-xyz' });

		expect(result).toEqual({ ok: true, value: { items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } });
	});
});

describe('ApplicationServices courses.search', () => {
	it('searches the seed catalog', async () => {
		const services = await buildApplicationServicesFactory({ environment: 'test' }).forRequest();

		const result = services.courses.search({ q: 'security', modality: 'online', status: 'active' });

		expect(result.ok && result.value.items.map((course) => course.id)).toEqual(['course-001']);
	});

	it('returns validation errors from the seed catalog search', async () => {
		const services = await buildApplicationServicesFactory({ environment: 'test' }).forRequest();

		expect(services.courses.search({ pageSize: '51' })).toEqual({ ok: false, errors: [{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' }] });
	});
});
