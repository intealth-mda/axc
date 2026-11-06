import { describe, expect, it } from 'vitest';
import { COURSE_FIXTURES } from './course-fixtures.ts';
import { type Course, type CourseQueryErrorDetail, type CourseSearchPage, type CourseSearchQueryInput, type CourseSearchResult, type CourseSortField, searchCourses } from './courses.ts';

const INVALID_MESSAGE = 'One or more query parameters are invalid.';
const PAGE_DETAIL: CourseQueryErrorDetail = { field: 'page', message: 'page must be a positive integer.' };
const PAGE_SIZE_DETAIL: CourseQueryErrorDetail = { field: 'pageSize', message: 'pageSize must be between 1 and 50.' };
const MODALITY_DETAIL: CourseQueryErrorDetail = { field: 'modality', message: 'modality must be one of: online, in-person, hybrid.' };
const STATUS_DETAIL: CourseQueryErrorDetail = { field: 'status', message: 'status must be one of: draft, active, retired.' };
const SORT_DETAIL: CourseQueryErrorDetail = { field: 'sort', message: 'sort must be one of: title, createdAt, updatedAt.' };

function course(id: string, overrides: Partial<Course> = {}): Course {
	return {
		id,
		title: `Title ${id}`,
		summary: `Summary ${id}`,
		modality: 'online',
		status: 'active',
		tags: [],
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
		...overrides,
	};
}

function expectPage(result: CourseSearchResult): CourseSearchPage {
	if (!result.ok) {
		throw new Error(`expected ok result, got error ${JSON.stringify(result.error)}`);
	}
	return result.value;
}

function ids(result: CourseSearchResult): string[] {
	return expectPage(result).items.map((c) => c.id);
}

function expectInvalid(query: CourseSearchQueryInput, details: CourseQueryErrorDetail[]): void {
	expect(searchCourses(query, COURSE_FIXTURES)).toEqual({
		ok: false,
		error: { code: 'INVALID_QUERY_PARAMETER', message: INVALID_MESSAGE, details },
	});
}

const ALL_FIXTURE_IDS_BY_TITLE = [
	'course-012', // Accessible Web Design
	'course-004', // Agentic Workflows in Practice
	'course-001', // AI Security Foundations
	'course-006', // Cloud Security Operations
	'course-008', // Data Privacy and Governance
	'course-010', // DevSecOps Pipelines
	'course-014', // Incident Response Bootcamp
	'course-007', // Introduction to TypeScript
	'course-013', // Kubernetes Fundamentals
	'course-002', // Prompt Engineering Essentials
	'course-011', // Responsible AI Leadership
	'course-003', // Secure Code Review Workshop
	'course-009', // Testing AI-Generated Code
	'course-005', // Threat Modeling for LLM Applications
];

describe('COURSE_FIXTURES', () => {
	it('contains at least 12 courses with unique ids', () => {
		expect(COURSE_FIXTURES.length).toBeGreaterThanOrEqual(12);
		expect(new Set(COURSE_FIXTURES.map((c) => c.id)).size).toBe(COURSE_FIXTURES.length);
	});

	it('includes every modality and every status', () => {
		expect(new Set(COURSE_FIXTURES.map((c) => c.modality))).toEqual(new Set(['online', 'in-person', 'hybrid']));
		expect(new Set(COURSE_FIXTURES.map((c) => c.status))).toEqual(new Set(['draft', 'active', 'retired']));
	});

	it('gives every course the required fields with ISO date strings', () => {
		for (const c of COURSE_FIXTURES) {
			expect(c.id).toEqual(expect.any(String));
			expect(c.title).toEqual(expect.any(String));
			expect(c.summary).toEqual(expect.any(String));
			expect(Array.isArray(c.tags)).toBe(true);
			expect(c.tags.length).toBeGreaterThan(0);
			expect(new Date(c.createdAt).toISOString()).toBe(c.createdAt);
			expect(new Date(c.updatedAt).toISOString()).toBe(c.updatedAt);
		}
	});
});

describe('searchCourses', () => {
	describe('default list', () => {
		it('returns page 1 of 10 items sorted by title with pagination metadata when no query is given', () => {
			expect(searchCourses({}, COURSE_FIXTURES)).toEqual({
				ok: true,
				value: {
					items: ALL_FIXTURE_IDS_BY_TITLE.slice(0, 10).map((id) => COURSE_FIXTURES.find((c) => c.id === id)),
					page: 1,
					pageSize: 10,
					totalItems: 14,
					totalPages: 2,
				},
			});
		});

		it('ignores unknown query parameters', () => {
			const page = expectPage(searchCourses({ foo: 'bar' }, COURSE_FIXTURES));
			expect(page.totalItems).toBe(14);
			expect(page.items.map((c) => c.id)).toEqual(ALL_FIXTURE_IDS_BY_TITLE.slice(0, 10));
		});

		it('treats undefined query values as absent', () => {
			const page = expectPage(searchCourses({ q: undefined, modality: undefined, page: undefined, sort: undefined }, COURSE_FIXTURES));
			expect(page.totalItems).toBe(14);
			expect(page.page).toBe(1);
			expect(page.pageSize).toBe(10);
		});
	});

	describe('keyword search (q)', () => {
		const data = [
			course('t', { title: 'Cyber SECURITY Basics' }),
			course('s', { summary: 'covers application security in depth' }),
			course('g', { tags: ['Security'] }),
			course('n', { title: 'Unrelated', summary: 'nothing here', tags: ['other'] }),
		];

		it('matches the title case-insensitively', () => {
			expect(ids(searchCourses({ q: 'cyber' }, data))).toEqual(['t']);
		});

		it('matches the summary case-insensitively', () => {
			expect(ids(searchCourses({ q: 'APPLICATION' }, data))).toEqual(['s']);
		});

		it('matches a tag case-insensitively', () => {
			const tagOnly = [course('g', { tags: ['Security'] }), course('n', { tags: ['other'] })];
			expect(ids(searchCourses({ q: 'secUrity' }, tagOnly))).toEqual(['g']);
		});

		it('matches substrings across title, summary and tags in one result', () => {
			expect(ids(searchCourses({ q: 'curi' }, data)).sort()).toEqual(['g', 's', 't']);
		});

		it('trims surrounding whitespace from q', () => {
			expect(ids(searchCourses({ q: '  cyber  ' }, data))).toEqual(['t']);
		});

		it('treats an empty or whitespace-only q as no filter', () => {
			expect(expectPage(searchCourses({ q: '' }, data)).totalItems).toBe(4);
			expect(expectPage(searchCourses({ q: '   ' }, data)).totalItems).toBe(4);
		});

		it('finds security courses in the fixtures by title, summary or tag', () => {
			expect(ids(searchCourses({ q: 'Security' }, COURSE_FIXTURES)).sort()).toEqual(['course-001', 'course-003', 'course-005', 'course-006', 'course-008', 'course-010', 'course-014']);
		});
	});

	describe('filters', () => {
		it('returns only courses with the requested modality', () => {
			const page = expectPage(searchCourses({ modality: 'online', pageSize: '50' }, COURSE_FIXTURES));
			expect(page.items.length).toBeGreaterThan(0);
			expect(page.items.every((c) => c.modality === 'online')).toBe(true);
			expect(page.totalItems).toBe(COURSE_FIXTURES.filter((c) => c.modality === 'online').length);
		});

		it('accepts the in-person modality', () => {
			expect(ids(searchCourses({ modality: 'in-person', pageSize: '50' }, COURSE_FIXTURES)).sort()).toEqual(['course-003', 'course-008', 'course-009', 'course-011', 'course-014']);
		});

		it('returns only courses with the requested status', () => {
			const page = expectPage(searchCourses({ status: 'active', pageSize: '50' }, COURSE_FIXTURES));
			expect(page.items.length).toBeGreaterThan(0);
			expect(page.items.every((c) => c.status === 'active')).toBe(true);
			expect(page.totalItems).toBe(COURSE_FIXTURES.filter((c) => c.status === 'active').length);
		});

		it('returns retired courses for status=retired', () => {
			expect(ids(searchCourses({ status: 'retired' }, COURSE_FIXTURES)).sort()).toEqual(['course-006', 'course-008', 'course-012']);
		});

		it('matches tag exactly and case-insensitively', () => {
			const data = [course('a', { tags: ['AI'] }), course('b', { tags: ['ai-ethics'] }), course('c', { tags: ['web'] }), course('d', { tags: ['web', 'ai'] })];
			expect(ids(searchCourses({ tag: 'ai' }, data)).sort()).toEqual(['a', 'd']);
			expect(ids(searchCourses({ tag: 'Ai' }, data)).sort()).toEqual(['a', 'd']);
		});

		it('trims the tag and treats an empty tag as no filter', () => {
			const data = [course('a', { tags: ['ai'] }), course('b', { tags: ['web'] })];
			expect(ids(searchCourses({ tag: '  ai ' }, data))).toEqual(['a']);
			expect(expectPage(searchCourses({ tag: '' }, data)).totalItems).toBe(2);
		});

		it('returns fixture courses tagged ai', () => {
			expect(ids(searchCourses({ tag: 'ai' }, COURSE_FIXTURES)).sort()).toEqual(['course-001', 'course-002', 'course-004', 'course-009', 'course-011']);
		});
	});

	describe('combined filters', () => {
		it('applies q, modality and status together', () => {
			expect(ids(searchCourses({ q: 'security', modality: 'online', status: 'active' }, COURSE_FIXTURES))).toEqual(['course-001', 'course-005']);
		});

		it('applies tag and status together', () => {
			expect(ids(searchCourses({ tag: 'security', status: 'active' }, COURSE_FIXTURES))).toEqual(['course-001', 'course-003']);
		});

		it('returns exactly the documented example response', () => {
			expect(searchCourses({ q: 'security', modality: 'online', status: 'active', tag: 'ai', page: '1', pageSize: '5', sort: 'title' }, COURSE_FIXTURES)).toEqual({
				ok: true,
				value: {
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
				},
			});
		});
	});

	describe('pagination', () => {
		it('returns the requested page and page size with metadata', () => {
			const page = expectPage(searchCourses({ page: '2', pageSize: '5' }, COURSE_FIXTURES));
			expect(page.items.map((c) => c.id)).toEqual(ALL_FIXTURE_IDS_BY_TITLE.slice(5, 10));
			expect(page.page).toBe(2);
			expect(page.pageSize).toBe(5);
			expect(page.totalItems).toBe(14);
			expect(page.totalPages).toBe(3);
		});

		it('returns a partial last page', () => {
			const page = expectPage(searchCourses({ page: '3', pageSize: '5' }, COURSE_FIXTURES));
			expect(page.items.map((c) => c.id)).toEqual(ALL_FIXTURE_IDS_BY_TITLE.slice(10));
		});

		it('returns no more than pageSize items for page 1 with pageSize 5', () => {
			const page = expectPage(searchCourses({ page: '1', pageSize: '5' }, COURSE_FIXTURES));
			expect(page.items).toHaveLength(5);
			expect(page.totalPages).toBe(3);
		});

		it('accepts the minimum pageSize of 1', () => {
			const page = expectPage(searchCourses({ pageSize: '1' }, COURSE_FIXTURES));
			expect(page.items.map((c) => c.id)).toEqual(['course-012']);
			expect(page.totalPages).toBe(14);
		});

		it('accepts the maximum pageSize of 50', () => {
			const page = expectPage(searchCourses({ pageSize: '50' }, COURSE_FIXTURES));
			expect(page.items.map((c) => c.id)).toEqual(ALL_FIXTURE_IDS_BY_TITLE);
			expect(page.pageSize).toBe(50);
			expect(page.totalPages).toBe(1);
		});

		it('returns an empty page with metadata when the page is past the end', () => {
			expect(searchCourses({ page: '3' }, COURSE_FIXTURES)).toEqual({
				ok: true,
				value: { items: [], page: 3, pageSize: 10, totalItems: 14, totalPages: 2 },
			});
		});
	});

	describe('sorting', () => {
		it('sorts by title case-insensitively by default', () => {
			const data = [course('1', { title: 'charlie' }), course('2', { title: 'Bravo' }), course('3', { title: 'alpha' })];
			expect(ids(searchCourses({}, data))).toEqual(['3', '2', '1']);
		});

		const sortCases: { sort: CourseSortField; data: Course[]; expected: string[] }[] = [
			{
				sort: 'title',
				data: [course('b', { title: 'Same' }), course('c', { title: 'Alpha' }), course('a', { title: 'Same' })],
				expected: ['c', 'a', 'b'],
			},
			{
				sort: 'createdAt',
				data: [
					course('b', { createdAt: '2026-01-01T00:00:00.000Z' }),
					course('c', { createdAt: '2025-01-01T00:00:00.000Z' }),
					course('a', { createdAt: '2026-01-01T00:00:00.000Z' }),
					course('d', { createdAt: '2027-01-01T00:00:00.000Z' }),
				],
				expected: ['c', 'a', 'b', 'd'],
			},
			{
				sort: 'updatedAt',
				data: [course('b', { updatedAt: '2026-05-01T00:00:00.000Z' }), course('c', { updatedAt: '2026-03-01T00:00:00.000Z' }), course('a', { updatedAt: '2026-05-01T00:00:00.000Z' })],
				expected: ['c', 'a', 'b'],
			},
		];

		for (const { sort, data, expected } of sortCases) {
			it(`sorts ascending by ${sort} and breaks ties by id`, () => {
				expect(ids(searchCourses({ sort }, data))).toEqual(expected);
			});
		}

		it('sorts fixtures by createdAt ascending', () => {
			expect(ids(searchCourses({ sort: 'createdAt', pageSize: '50' }, COURSE_FIXTURES))).toEqual([
				'course-012',
				'course-006',
				'course-008',
				'course-013',
				'course-009',
				'course-014',
				'course-002',
				'course-003',
				'course-001',
				'course-005',
				'course-004',
				'course-007',
				'course-010',
				'course-011',
			]);
		});

		it('sorts before paginating', () => {
			const data = [course('1', { title: 'd' }), course('2', { title: 'c' }), course('3', { title: 'b' }), course('4', { title: 'a' })];
			expect(ids(searchCourses({ page: '2', pageSize: '2' }, data))).toEqual(['2', '1']);
		});
	});

	describe('validation', () => {
		it('rejects an unknown modality', () => {
			expectInvalid({ modality: 'remote' }, [MODALITY_DETAIL]);
		});

		it('rejects a modality with different case', () => {
			expectInvalid({ modality: 'Online' }, [MODALITY_DETAIL]);
		});

		it('rejects an empty modality', () => {
			expectInvalid({ modality: '' }, [MODALITY_DETAIL]);
		});

		it('rejects an unknown status', () => {
			expectInvalid({ status: 'archived' }, [STATUS_DETAIL]);
		});

		it('rejects an empty status', () => {
			expectInvalid({ status: '' }, [STATUS_DETAIL]);
		});

		it('rejects an unknown sort field', () => {
			expectInvalid({ sort: 'price' }, [SORT_DETAIL]);
		});

		it('rejects an empty sort', () => {
			expectInvalid({ sort: '' }, [SORT_DETAIL]);
		});

		for (const page of ['0', '-1', 'abc', '1.5']) {
			it(`rejects page=${page}`, () => {
				expectInvalid({ page }, [PAGE_DETAIL]);
			});
		}

		it('rejects a digits-only page too large to be a finite number', () => {
			expectInvalid({ page: '9'.repeat(400) }, [PAGE_DETAIL]);
		});

		it('rejects a page above Number.MAX_SAFE_INTEGER instead of rounding it', () => {
			expectInvalid({ page: '9007199254740993' }, [PAGE_DETAIL]);
		});

		it('accepts page=Number.MAX_SAFE_INTEGER and returns an empty page', () => {
			expect(searchCourses({ page: String(Number.MAX_SAFE_INTEGER) }, COURSE_FIXTURES)).toEqual({
				ok: true,
				value: { items: [], page: Number.MAX_SAFE_INTEGER, pageSize: 10, totalItems: 14, totalPages: 2 },
			});
		});

		it('rejects a digits-only pageSize too large to be a finite number', () => {
			expectInvalid({ pageSize: '9'.repeat(400) }, [PAGE_SIZE_DETAIL]);
		});

		for (const pageSize of ['0', '51', 'x', '-5', '2.5']) {
			it(`rejects pageSize=${pageSize}`, () => {
				expectInvalid({ pageSize }, [PAGE_SIZE_DETAIL]);
			});
		}

		it('reports every invalid field in the order modality, status, page, pageSize, sort', () => {
			expectInvalid({ sort: 'price', pageSize: '51', page: '0', status: 'archived', modality: 'remote' }, [MODALITY_DETAIL, STATUS_DETAIL, PAGE_DETAIL, PAGE_SIZE_DETAIL, SORT_DETAIL]);
		});

		it('reports only the invalid fields when valid ones are mixed in', () => {
			expectInvalid({ q: 'security', modality: 'online', status: 'nope', pageSize: '100' }, [STATUS_DETAIL, PAGE_SIZE_DETAIL]);
		});
	});

	describe('no matches', () => {
		it('returns ok with empty items, zero totals and the requested pagination', () => {
			expect(searchCourses({ q: 'no-such-course-xyz' }, COURSE_FIXTURES)).toEqual({
				ok: true,
				value: { items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
			});
		});

		it('returns ok with empty items when combined filters exclude everything', () => {
			expect(searchCourses({ modality: 'hybrid', status: 'retired', tag: 'ai', pageSize: '5' }, COURSE_FIXTURES)).toEqual({
				ok: true,
				value: { items: [], page: 1, pageSize: 5, totalItems: 0, totalPages: 0 },
			});
		});

		it('returns ok with empty items for an empty course list', () => {
			expect(searchCourses({}, [])).toEqual({
				ok: true,
				value: { items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
			});
		});
	});
});
