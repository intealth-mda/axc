import { Course, type CourseRepository, systemCatalogPassport } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { courseSeed } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { type CourseSearchQuery, parseCourseSearchQuery, queryCourses } from './query-courses.ts';

function fixtureDataSources(): DataSources {
	const courses = courseSeed.map((props) => Course.getNewInstance(props, systemCatalogPassport));
	const repository: CourseRepository = {
		get(id: string): Promise<Course> {
			const found = courses.find((course) => course.id === id);
			if (found === undefined) {
				return Promise.reject(new Error(`Missing ${id}`));
			}
			return Promise.resolve(found);
		},
		save(item: Course): Promise<Course> {
			return Promise.resolve(item);
		},
		list(): Promise<readonly Course[]> {
			return Promise.resolve(courses);
		},
	};
	return {
		readonlyDataSource: {
			course: repository,
		},
	};
}

function search(query: CourseSearchQuery) {
	return queryCourses(fixtureDataSources())(query);
}

function fieldsOf(params: Readonly<Record<string, string>>): string[] {
	const parsed = parseCourseSearchQuery(params);
	if (parsed.ok) {
		return [];
	}
	return parsed.details.map((detail) => detail.field).sort();
}

describe('course catalog search', () => {
	it('returns the default page sorted by title', async () => {
		const page = await search({ page: 1, pageSize: 10, sort: 'title' });

		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
		expect(page.totalItems).toBe(12);
		expect(page.totalPages).toBe(2);
		expect(page.items).toHaveLength(10);
		expect(page.items[0]?.title).toBe('Active Hybrid Security');
		expect(page.items[1]?.title).toBe('AI Security Foundations');
	});

	it('matches a keyword in title, summary, or tags regardless of case', async () => {
		const page = await search({ q: 'SeCuRiTy', page: 1, pageSize: 10, sort: 'title' });
		const ids = page.items.map((item) => item.id);

		expect(ids).toEqual(['course-012', 'course-001', 'course-010', 'course-002']);
		for (const item of page.items) {
			const haystack = `${item.title} ${item.summary} ${item.tags.join(' ')}`.toLowerCase();
			expect(haystack).toContain('security');
		}
	});

	it('filters modality, status, and tag', async () => {
		const online = await search({ modality: 'online', page: 1, pageSize: 10, sort: 'title' });
		const active = await search({ status: 'active', page: 1, pageSize: 10, sort: 'title' });
		const tagged = await search({ tag: 'AI', page: 1, pageSize: 10, sort: 'title' });

		expect(online.items.every((item) => item.modality === 'online')).toBe(true);
		expect(online.totalItems).toBe(5);
		expect(active.items.every((item) => item.status === 'active')).toBe(true);
		expect(active.totalItems).toBe(6);
		expect(tagged.items.map((item) => item.id)).toEqual(['course-001', 'course-009']);
	});

	it('combines keyword, modality, and status', async () => {
		const page = await search({ q: 'security', modality: 'online', status: 'active', page: 1, pageSize: 10, sort: 'title' });

		expect(page.items.map((item) => item.id)).toEqual(['course-001']);
		expect(page.totalItems).toBe(1);
	});

	it('paginates and sorts by createdAt', async () => {
		const page = await search({ page: 1, pageSize: 5, sort: 'createdAt' });

		expect(page.items).toHaveLength(5);
		expect(page.totalItems).toBe(12);
		expect(page.totalPages).toBe(3);
		expect(page.items.map((item) => item.id)).toEqual(['course-005', 'course-004', 'course-001', 'course-012', 'course-002']);
		const second = await search({ page: 2, pageSize: 10, sort: 'title' });
		expect(second.items).toHaveLength(2);
	});

	it('accepts the pageSize boundary and rejects values outside it', () => {
		const boundary = parseCourseSearchQuery({ pageSize: '50', page: '1', sort: 'title', modality: 'online', status: 'active' });
		expect(boundary.ok).toBe(true);
		if (boundary.ok) {
			expect(boundary.query.pageSize).toBe(50);
		}

		expect(fieldsOf({ pageSize: '51' })).toEqual(['pageSize']);
		expect(fieldsOf({ pageSize: '0' })).toEqual(['pageSize']);
		expect(fieldsOf({ page: '0' })).toEqual(['page']);
		expect(fieldsOf({ modality: 'remote' })).toEqual(['modality']);
		expect(fieldsOf({ status: 'published' })).toEqual(['status']);
		expect(fieldsOf({ sort: 'rating' })).toEqual(['sort']);
		const parsed = parseCourseSearchQuery({ modality: 'nope', status: 'nope', page: '0', pageSize: '51', sort: 'nope' });
		expect(parsed.ok).toBe(false);
		if (!parsed.ok) {
			expect(parsed.details.map((detail) => detail.field).sort()).toEqual(['modality', 'page', 'pageSize', 'sort', 'status']);
			expect(parsed.details.find((detail) => detail.field === 'pageSize')?.message).toBe('pageSize must be between 1 and 50.');
		}
	});

	it('returns an empty page when nothing matches', async () => {
		const page = await search({ q: 'zzznomatch', page: 1, pageSize: 10, sort: 'title' });

		expect(page.items).toEqual([]);
		expect(page.totalItems).toBe(0);
		expect(page.totalPages).toBe(0);
		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
	});
});
