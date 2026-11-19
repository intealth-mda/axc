import { COURSE_CATALOG_SEED, Course, type CourseCatalog } from '@axc/domain';
import { describe, expect, it } from 'vitest';
import { buildApplicationServicesFactory } from './index.ts';
import { type CourseSearchOutcome, type CourseSearchPage, type RawCourseQuery, searchCourses } from './search-courses.ts';

const TITLE_ORDER = [
	'course-012',
	'course-013',
	'course-001',
	'course-008',
	'course-007',
	'course-002',
	'course-005',
	'course-010',
	'course-011',
	'course-009',
	'course-003',
	'course-014',
	'course-006',
	'course-004',
	'course-015',
];
const CREATED_ORDER = [
	'course-004',
	'course-001',
	'course-007',
	'course-002',
	'course-011',
	'course-003',
	'course-014',
	'course-005',
	'course-006',
	'course-008',
	'course-009',
	'course-010',
	'course-012',
	'course-013',
	'course-015',
];
const UPDATED_ORDER = [
	'course-007',
	'course-003',
	'course-004',
	'course-005',
	'course-002',
	'course-006',
	'course-001',
	'course-008',
	'course-010',
	'course-009',
	'course-011',
	'course-012',
	'course-013',
	'course-014',
	'course-015',
];

function seedCatalog(): CourseCatalog {
	const courses = COURSE_CATALOG_SEED.map((props) => Course.create(props));
	return {
		listCourses() {
			return Promise.resolve(courses);
		},
	};
}

const catalog = seedCatalog();

async function pageFor(rawQuery: RawCourseQuery): Promise<CourseSearchPage> {
	return expectPage(await searchCourses(catalog, rawQuery));
}

function expectPage(outcome: CourseSearchOutcome): CourseSearchPage {
	expect(outcome.ok).toBe(true);
	if (!outcome.ok) {
		throw new Error('expected a course page');
	}
	return outcome.body;
}

function expectError(outcome: CourseSearchOutcome) {
	expect(outcome.ok).toBe(false);
	if (outcome.ok) {
		throw new Error('expected a query error');
	}
	return outcome.body;
}

describe('course catalog seed', () => {
	it('covers mixed modality, status, and tags', () => {
		expect(COURSE_CATALOG_SEED.length).toBeGreaterThanOrEqual(12);
		expect(new Set(COURSE_CATALOG_SEED.map((course) => course.modality)).size).toBe(3);
		expect(new Set(COURSE_CATALOG_SEED.map((course) => course.status)).size).toBe(3);
		expect(COURSE_CATALOG_SEED.filter((course) => course.tags.length >= 2).length).toBeGreaterThanOrEqual(3);
	});
});

describe('searchCourses', () => {
	it('returns the first page sorted by title with default pagination', async () => {
		const page = await pageFor({});

		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
		expect(page.totalItems).toBe(15);
		expect(page.totalPages).toBe(2);
		expect(page.items.map((item) => item.id)).toEqual(TITLE_ORDER.slice(0, 10));
		expect(page.items[0]).toMatchObject({
			id: 'course-012',
			title: 'Accessibility for Courses',
			modality: 'hybrid',
			status: 'retired',
			tags: ['accessibility'],
		});
	});

	it('matches a keyword across title, summary, and tags without case sensitivity', async () => {
		const expected = ['course-001', 'course-005', 'course-006', 'course-004'];
		expect((await pageFor({ q: ['security'] })).items.map((item) => item.id)).toEqual(expected);
		expect((await pageFor({ q: ['SECURITY'] })).items.map((item) => item.id)).toEqual(expected);
		expect((await pageFor({ q: ['  SeCuRiTy  '] })).items.map((item) => item.id)).toEqual(expected);
	});

	it('filters by modality, status, and tag', async () => {
		expect((await pageFor({ modality: ['online'] })).items.map((item) => item.id)).toEqual(['course-001', 'course-007', 'course-005', 'course-010', 'course-014', 'course-015']);
		expect((await pageFor({ status: ['active'] })).items.map((item) => item.id)).toEqual(['course-013', 'course-001', 'course-008', 'course-002', 'course-009', 'course-014', 'course-006']);
		expect((await pageFor({ tag: ['ai'] })).items.map((item) => item.id)).toEqual(['course-001', 'course-008', 'course-009']);
		expect((await pageFor({ tag: ['AI'] })).items.map((item) => item.id)).toEqual(['course-001', 'course-008', 'course-009']);
		expect((await pageFor({ tag: ['sec'] })).items).toEqual([]);
	});

	it('combines keyword, modality, and status', async () => {
		const page = await pageFor({ q: ['security'], modality: ['online'], status: ['active'], tag: ['ai'], page: ['1'], pageSize: ['5'], sort: ['title'] });

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

	it('paginates after filtering and sorting', async () => {
		const first = await pageFor({ page: ['1'], pageSize: ['5'] });
		const second = await pageFor({ page: ['2'], pageSize: ['10'] });
		const beyond = await pageFor({ page: ['4'], pageSize: ['5'] });

		expect(first.items).toHaveLength(5);
		expect(first.totalItems).toBe(15);
		expect(first.totalPages).toBe(3);
		expect(first.items.map((item) => item.id)).toEqual(TITLE_ORDER.slice(0, 5));
		expect(second.items.map((item) => item.id)).toEqual(TITLE_ORDER.slice(10));
		expect(second.page).toBe(2);
		expect(second.pageSize).toBe(10);
		expect(beyond.items).toEqual([]);
		expect(beyond.totalItems).toBe(15);
		expect(beyond.totalPages).toBe(3);
		expect(beyond.page).toBe(4);
	});

	it('sorts by createdAt and updatedAt ascending', async () => {
		expect((await pageFor({ sort: ['createdAt'], pageSize: ['50'] })).items.map((item) => item.id)).toEqual(CREATED_ORDER);
		expect((await pageFor({ sort: ['updatedAt'], pageSize: ['50'] })).items.map((item) => item.id)).toEqual(UPDATED_ORDER);
		expect((await pageFor({ sort: ['title'], pageSize: ['50'] })).items.map((item) => item.id)).toEqual(TITLE_ORDER);
	});

	it('returns an empty page when nothing matches', async () => {
		const page = await pageFor({ q: ['zzznomatchxyz'] });

		expect(page).toEqual({
			items: [],
			page: 1,
			pageSize: 10,
			totalItems: 0,
			totalPages: 0,
		});
	});

	it('rejects invalid modality, status, page, pageSize, and sort', async () => {
		const error = expectError(await searchCourses(catalog, { modality: ['remote'], status: ['archived'], page: ['0'], pageSize: ['51'], sort: ['name'] }));

		expect(error).toEqual({
			error: {
				code: 'INVALID_QUERY_PARAMETER',
				message: 'One or more query parameters are invalid.',
				details: [
					{ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' },
					{ field: 'status', message: 'status must be one of draft, active, retired.' },
					{ field: 'page', message: 'page must be an integer greater than or equal to 1.' },
					{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' },
					{ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' },
				],
			},
		});
	});

	it('rejects non-integers, empty tag, duplicates, and unknown parameters', async () => {
		expect(expectError(await searchCourses(catalog, { page: ['1.5'] })).error.details).toEqual([{ field: 'page', message: 'page must be an integer greater than or equal to 1.' }]);
		expect(expectError(await searchCourses(catalog, { page: ['abc'] })).error.details[0]?.field).toBe('page');
		expect(expectError(await searchCourses(catalog, { pageSize: ['0'] })).error.details[0]?.message).toBe('pageSize must be between 1 and 50.');
		expect(expectError(await searchCourses(catalog, { pageSize: ['abc'] })).error.details[0]?.field).toBe('pageSize');
		expect(expectError(await searchCourses(catalog, { tag: [' '] })).error.details).toEqual([{ field: 'tag', message: 'tag must be a non-empty string.' }]);
		expect(expectError(await searchCourses(catalog, { page: ['1', '2'] })).error.details).toEqual([{ field: 'page', message: 'page must be provided once.' }]);
		expect(expectError(await searchCourses(catalog, { limit: ['10'] })).error.details).toEqual([{ field: 'limit', message: 'limit is not a supported query parameter.' }]);
	});

	it('treats a blank keyword as no keyword filter', async () => {
		expect((await pageFor({ q: [' '] })).totalItems).toBe(15);
	});

	it('serves the seeded catalog from the application service factory', async () => {
		const services = await buildApplicationServicesFactory({ environment: 'test' }).forRequest();
		const page = expectPage(await services.courses.search({}));

		expect(page.totalItems).toBe(COURSE_CATALOG_SEED.length);
		expect(page.items.map((item) => item.id)).toEqual(TITLE_ORDER.slice(0, 10));
	});
});
