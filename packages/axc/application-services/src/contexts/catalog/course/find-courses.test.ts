import { describe, expect, it } from 'vitest';
import { buildApplicationServicesFactory } from '../../../index.ts';
import type { CourseSearchOutcome } from './find-courses.ts';

const TITLE_PAGE = ['course-001', 'course-008', 'course-011', 'course-007', 'course-009', 'course-012', 'course-004', 'course-003', 'course-006', 'course-010'];

async function catalog(queryString: string): Promise<CourseSearchOutcome> {
	const services = await buildApplicationServicesFactory({ environment: 'test' }).forRequest();
	return services.course.search(queryString);
}

function expectPage(outcome: CourseSearchOutcome, expected: { ids: string[]; page: number; pageSize: number; totalItems: number; totalPages: number }): void {
	if (!outcome.ok) {
		throw new Error('expected a course page');
	}
	expect(outcome.body.page).toBe(expected.page);
	expect(outcome.body.pageSize).toBe(expected.pageSize);
	expect(outcome.body.totalItems).toBe(expected.totalItems);
	expect(outcome.body.totalPages).toBe(expected.totalPages);
	expect(outcome.body.items.map((item) => item.id)).toEqual(expected.ids);
}

function expectInvalid(outcome: CourseSearchOutcome, fields: string[]): void {
	expect(outcome.ok).toBe(false);
	if (outcome.ok) {
		throw new Error('expected invalid query');
	}
	expect(outcome.body.error.code).toBe('INVALID_QUERY_PARAMETER');
	expect(outcome.body.error.message).toBe('One or more query parameters are invalid.');
	expect(outcome.body.error.details.map((detail) => detail.field).sort()).toEqual([...fields].sort());
}

describe('course catalog search', () => {
	it('returns the default title-sorted page', async () => {
		const outcome = await catalog('');

		expectPage(outcome, { ids: TITLE_PAGE, page: 1, pageSize: 10, totalItems: 12, totalPages: 2 });
	});

	it('defaults the sort to title', async () => {
		const implicitSort = await catalog('');
		const explicitSort = await catalog('sort=title');
		if (!implicitSort.ok || !explicitSort.ok) {
			throw new Error('expected a course page');
		}

		expect(implicitSort.body.items.map((item) => item.id)).toEqual(explicitSort.body.items.map((item) => item.id));
	});

	it('matches a keyword across title, summary, and tags regardless of case', async () => {
		const outcome = await catalog('q=SeCuRiTy');

		expectPage(outcome, {
			ids: ['course-001', 'course-011', 'course-012', 'course-004', 'course-006'],
			page: 1,
			pageSize: 10,
			totalItems: 5,
			totalPages: 1,
		});
	});

	it('matches a keyword that appears only in the summary', async () => {
		const outcome = await catalog('q=obligations');

		expectPage(outcome, { ids: ['course-004'], page: 1, pageSize: 10, totalItems: 1, totalPages: 1 });
	});

	it('matches a keyword that appears only in a tag', async () => {
		const outcome = await catalog('q=OPERATIONS');

		expectPage(outcome, { ids: ['course-006'], page: 1, pageSize: 10, totalItems: 1, totalPages: 1 });
	});

	it('filters by modality', async () => {
		const outcome = await catalog('modality=online');

		expectPage(outcome, {
			ids: ['course-001', 'course-008', 'course-012', 'course-004', 'course-005'],
			page: 1,
			pageSize: 10,
			totalItems: 5,
			totalPages: 1,
		});
	});

	it('filters by status', async () => {
		const outcome = await catalog('status=active');

		expectPage(outcome, {
			ids: ['course-001', 'course-011', 'course-007', 'course-012', 'course-005', 'course-002'],
			page: 1,
			pageSize: 10,
			totalItems: 6,
			totalPages: 1,
		});
	});

	it('filters by tag regardless of case', async () => {
		const outcome = await catalog('tag=AI');

		expectPage(outcome, {
			ids: ['course-001', 'course-010', 'course-005'],
			page: 1,
			pageSize: 10,
			totalItems: 3,
			totalPages: 1,
		});
	});

	it('combines keyword, modality, and status filters', async () => {
		const outcome = await catalog('q=security&modality=online&status=active');

		expectPage(outcome, {
			ids: ['course-001', 'course-012'],
			page: 1,
			pageSize: 10,
			totalItems: 2,
			totalPages: 1,
		});
	});

	it('returns the documented combined search example', async () => {
		const outcome = await catalog('q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title');
		if (!outcome.ok) {
			throw new Error('expected a course page');
		}

		expect(outcome.body).toEqual({
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

	it('returns the requested page and page size', async () => {
		const outcome = await catalog('page=2&pageSize=5');

		expectPage(outcome, {
			ids: ['course-012', 'course-004', 'course-003', 'course-006', 'course-010'],
			page: 2,
			pageSize: 5,
			totalItems: 12,
			totalPages: 3,
		});
	});

	it('sorts by createdAt', async () => {
		const outcome = await catalog('sort=createdAt&pageSize=50');

		expectPage(outcome, {
			ids: ['course-009', 'course-004', 'course-010', 'course-001', 'course-006', 'course-002', 'course-003', 'course-005', 'course-007', 'course-008', 'course-011', 'course-012'],
			page: 1,
			pageSize: 50,
			totalItems: 12,
			totalPages: 1,
		});
	});

	it('sorts by updatedAt', async () => {
		const outcome = await catalog('sort=updatedAt&pageSize=50');

		expectPage(outcome, {
			ids: ['course-009', 'course-006', 'course-004', 'course-003', 'course-002', 'course-001', 'course-008', 'course-005', 'course-011', 'course-007', 'course-012', 'course-010'],
			page: 1,
			pageSize: 50,
			totalItems: 12,
			totalPages: 1,
		});
	});

	it('returns an empty page when nothing matches', async () => {
		const outcome = await catalog('q=zzzz-no-such-course');

		expectPage(outcome, { ids: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
	});

	it('accepts the pageSize boundary of 1', async () => {
		const outcome = await catalog('pageSize=1');

		expectPage(outcome, { ids: ['course-001'], page: 1, pageSize: 1, totalItems: 12, totalPages: 12 });
	});

	it('accepts the pageSize boundary of 50', async () => {
		const outcome = await catalog('pageSize=50');
		if (!outcome.ok) {
			throw new Error('expected a course page');
		}

		expect(outcome.body.pageSize).toBe(50);
		expect(outcome.body.totalItems).toBe(12);
		expect(outcome.body.totalPages).toBe(1);
		expect(outcome.body.items).toHaveLength(12);
	});

	it('rejects pageSize below 1', async () => {
		const outcome = await catalog('pageSize=0');

		expectInvalid(outcome, ['pageSize']);
		if (!outcome.ok) {
			expect(outcome.body.error.details.find((detail) => detail.field === 'pageSize')?.message).toBe('pageSize must be between 1 and 50.');
		}
	});

	it('rejects pageSize above 50', async () => {
		const outcome = await catalog('pageSize=51');

		expectInvalid(outcome, ['pageSize']);
	});

	it('accepts the page boundary of 1', async () => {
		const outcome = await catalog('page=1');

		expectPage(outcome, { ids: TITLE_PAGE, page: 1, pageSize: 10, totalItems: 12, totalPages: 2 });
	});

	it('rejects page below 1', async () => {
		const outcome = await catalog('page=0');

		expectInvalid(outcome, ['page']);
		if (!outcome.ok) {
			expect(outcome.body.error.details.find((detail) => detail.field === 'page')?.message).toBe('page must be an integer greater than or equal to 1.');
		}
	});

	it('rejects a non-integer page', async () => {
		const outcome = await catalog('page=1.5');

		expectInvalid(outcome, ['page']);
	});

	it('accepts the in-person modality boundary', async () => {
		const outcome = await catalog('modality=in-person');

		expectPage(outcome, { ids: ['course-009', 'course-006', 'course-002'], page: 1, pageSize: 10, totalItems: 3, totalPages: 1 });
	});

	it('rejects an unknown modality', async () => {
		const outcome = await catalog('modality=classroom');

		expectInvalid(outcome, ['modality']);
		if (!outcome.ok) {
			expect(outcome.body.error.details.find((detail) => detail.field === 'modality')?.message).toBe('modality must be one of online, in-person, hybrid.');
		}
	});

	it('accepts the retired status boundary', async () => {
		const outcome = await catalog('status=retired');

		expectPage(outcome, { ids: ['course-009', 'course-004', 'course-010'], page: 1, pageSize: 10, totalItems: 3, totalPages: 1 });
	});

	it('rejects an unknown status', async () => {
		const outcome = await catalog('status=published');

		expectInvalid(outcome, ['status']);
		if (!outcome.ok) {
			expect(outcome.body.error.details.find((detail) => detail.field === 'status')?.message).toBe('status must be one of draft, active, retired.');
		}
	});

	it('rejects an unknown sort', async () => {
		const outcome = await catalog('sort=popularity');

		expectInvalid(outcome, ['sort']);
		if (!outcome.ok) {
			expect(outcome.body.error.details.find((detail) => detail.field === 'sort')?.message).toBe('sort must be one of title, createdAt, updatedAt.');
		}
	});

	it('lists every invalid field when several parameters are wrong', async () => {
		const outcome = await catalog('modality=classroom&status=published&page=0&pageSize=51&sort=popularity');

		expectInvalid(outcome, ['modality', 'page', 'pageSize', 'sort', 'status']);
	});

	it('rejects a repeated modality parameter', async () => {
		const outcome = await catalog('modality=online&modality=hybrid');

		expectInvalid(outcome, ['modality']);
	});

	it('rejects an unknown query parameter', async () => {
		const outcome = await catalog('limit=10');

		expectInvalid(outcome, ['limit']);
	});
});
