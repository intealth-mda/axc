import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';
import { searchCourseCatalog } from './course.catalog-search.ts';
import type { CourseProps } from './course.entity.ts';
import type { CoursePassport } from './course.passport.ts';
import type { CourseSearchCriteria } from './course.repository.ts';

const passport: CoursePassport = { kind: 'course-catalog' };

function course(props: CourseProps): Course {
	return Course.getNewInstance(props, passport);
}

const courses = [
	course({
		id: 'c1',
		title: 'Security Basics',
		summary: 'A plain introduction.',
		modality: 'online',
		status: 'active',
		tags: ['intro'],
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
	}),
	course({
		id: 'c2',
		title: 'Gardening',
		summary: 'Grow vegetables.',
		modality: 'online',
		status: 'active',
		tags: ['security'],
		createdAt: '2026-01-02T00:00:00.000Z',
		updatedAt: '2026-01-02T00:00:00.000Z',
	}),
	course({
		id: 'c3',
		title: 'Painting',
		summary: 'Color security theory.',
		modality: 'in-person',
		status: 'draft',
		tags: ['art'],
		createdAt: '2026-01-03T00:00:00.000Z',
		updatedAt: '2026-01-03T00:00:00.000Z',
	}),
	course({
		id: 'c4',
		title: 'SECURITY Lab',
		summary: 'Hands-on lab.',
		modality: 'hybrid',
		status: 'retired',
		tags: ['lab'],
		createdAt: '2026-02-01T00:00:00.000Z',
		updatedAt: '2026-02-01T00:00:00.000Z',
	}),
	course({
		id: 'c5',
		title: 'Cooking',
		summary: 'Weeknight meals.',
		modality: 'online',
		status: 'active',
		tags: ['AI', 'food'],
		createdAt: '2026-03-01T00:00:00.000Z',
		updatedAt: '2026-03-01T00:00:00.000Z',
	}),
	course({
		id: 'c6',
		title: 'Yoga',
		summary: 'Morning movement.',
		modality: 'in-person',
		status: 'active',
		tags: ['health'],
		createdAt: '2026-04-01T00:00:00.000Z',
		updatedAt: '2026-04-01T00:00:00.000Z',
	}),
];

function criteria(overrides: Partial<CourseSearchCriteria> = {}): CourseSearchCriteria {
	return {
		page: 1,
		pageSize: 10,
		sort: 'title',
		...overrides,
	};
}

describe('searchCourseCatalog', () => {
	it('matches a keyword across title, summary, and tags regardless of case', () => {
		const page = searchCourseCatalog(courses, criteria({ q: 'SeCuRiTy' }));

		expect(page.items.map((item) => item.id)).toEqual(['c2', 'c3', 'c4', 'c1']);
		expect(page.totalItems).toBe(4);
	});

	it('filters modality, status, and tag', () => {
		expect(searchCourseCatalog(courses, criteria({ modality: 'online' })).totalItems).toBe(3);
		expect(searchCourseCatalog(courses, criteria({ status: 'active' })).totalItems).toBe(4);
		expect(searchCourseCatalog(courses, criteria({ tag: 'ai' })).items.map((item) => item.id)).toEqual(['c5']);
		expect(searchCourseCatalog(courses, criteria({ tag: 'a' })).totalItems).toBe(0);
	});

	it('combines keyword, modality, and status', () => {
		const page = searchCourseCatalog(courses, criteria({ q: 'security', modality: 'online', status: 'active' }));

		expect(page.items.map((item) => item.id)).toEqual(['c2', 'c1']);
		expect(page.totalItems).toBe(2);
	});

	it('paginates after sorting by title', () => {
		const page = searchCourseCatalog(courses, criteria({ page: 1, pageSize: 2, sort: 'title' }));

		expect(page.items.map((item) => item.id)).toEqual(['c5', 'c2']);
		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(2);
		expect(page.totalItems).toBe(6);
		expect(page.totalPages).toBe(3);
	});

	it('sorts by createdAt ascending', () => {
		const page = searchCourseCatalog(courses, criteria({ sort: 'createdAt', pageSize: 50 }));

		expect(page.items.map((item) => item.id)).toEqual(['c1', 'c2', 'c3', 'c4', 'c5', 'c6']);
	});

	it('returns an empty page when nothing matches', () => {
		const page = searchCourseCatalog(courses, criteria({ q: 'zzznomatch' }));

		expect(page.items).toEqual([]);
		expect(page.totalItems).toBe(0);
		expect(page.totalPages).toBe(0);
		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
	});

	it('returns an empty item list past the last page and keeps the totals', () => {
		const page = searchCourseCatalog(courses, criteria({ page: 9, pageSize: 10 }));

		expect(page.items).toEqual([]);
		expect(page.totalItems).toBe(6);
		expect(page.totalPages).toBe(1);
	});
});
