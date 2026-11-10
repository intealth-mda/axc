import { describe, expect, it } from 'vitest';
import { COURSE_SEED } from './course-seed.ts';
import { createCourseCatalogRepository } from './memory-course.repository.ts';

function compareText(left: string, right: string): number {
	if (left < right) {
		return -1;
	}
	if (left > right) {
		return 1;
	}
	return 0;
}

describe('course catalog seed', () => {
	it('seeds at least 12 courses with mixed modality, status, and tags', () => {
		expect(COURSE_SEED.length).toBeGreaterThanOrEqual(12);
		expect(new Set(COURSE_SEED.map((course) => course.modality))).toEqual(new Set(['online', 'in-person', 'hybrid']));
		expect(new Set(COURSE_SEED.map((course) => course.status))).toEqual(new Set(['draft', 'active', 'retired']));
		expect(COURSE_SEED.every((course) => course.tags.length > 0)).toBe(true);
	});

	it('returns the default title page', async () => {
		const page = await createCourseCatalogRepository().search({ page: 1, pageSize: 10, sort: 'title' });

		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
		expect(page.totalItems).toBe(13);
		expect(page.totalPages).toBe(2);
		expect(page.items).toHaveLength(10);
		expect(page.items[0]?.id).toBe('course-001');
		const titles = page.items.map((course) => course.props.title);
		expect(titles).toEqual([...titles].sort(compareText));
	});

	it('matches security in title, summary, or tags regardless of case', async () => {
		const page = await createCourseCatalogRepository().search({ q: 'SeCuRiTy', page: 1, pageSize: 50, sort: 'title' });
		const byId = new Map(page.items.map((course) => [course.id, course]));

		expect(page.items.map((course) => course.id)).toEqual(['course-001', 'course-006', 'course-009', 'course-012']);
		expect(byId.get('course-006')?.props.title.toLocaleLowerCase('en-US').includes('security')).toBe(false);
		expect(byId.get('course-006')?.props.summary.toLocaleLowerCase('en-US').includes('security')).toBe(false);
		expect(byId.get('course-009')?.props.title.toLocaleLowerCase('en-US').includes('security')).toBe(false);
		expect(byId.get('course-009')?.props.tags.some((tag) => tag.toLocaleLowerCase('en-US').includes('security'))).toBe(false);
		expect(byId.get('course-012')?.props.title.toLocaleLowerCase('en-US').includes('security')).toBe(true);
	});

	it('filters modality, status, and tag', async () => {
		const repository = createCourseCatalogRepository();

		const online = await repository.search({ modality: 'online', page: 1, pageSize: 50, sort: 'title' });
		expect(online.totalItems).toBe(6);
		expect(online.items.every((course) => course.props.modality === 'online')).toBe(true);

		const active = await repository.search({ status: 'active', page: 1, pageSize: 50, sort: 'title' });
		expect(active.totalItems).toBe(7);
		expect(active.items.every((course) => course.props.status === 'active')).toBe(true);

		const tagged = await repository.search({ tag: 'AI', page: 1, pageSize: 50, sort: 'title' });
		expect(tagged.items.map((course) => course.id)).toEqual(['course-001', 'course-011']);
	});

	it('combines keyword, modality, and status', async () => {
		const page = await createCourseCatalogRepository().search({
			q: 'security',
			modality: 'online',
			status: 'active',
			tag: 'ai',
			page: 1,
			pageSize: 5,
			sort: 'title',
		});

		expect(page.totalItems).toBe(1);
		expect(page.totalPages).toBe(1);
		expect(page.items[0]?.id).toBe('course-001');
		expect(page.items[0]?.props.title).toBe('AI Security Foundations');
	});

	it('paginates and sorts by createdAt', async () => {
		const repository = createCourseCatalogRepository();
		const first = await repository.search({ page: 1, pageSize: 5, sort: 'createdAt' });
		const created = await repository.search({ page: 1, pageSize: 50, sort: 'createdAt' });
		const second = await repository.search({ page: 2, pageSize: 10, sort: 'title' });

		expect(first.items).toHaveLength(5);
		expect(first.totalItems).toBe(13);
		expect(first.totalPages).toBe(3);
		expect(first.items[0]?.id).toBe('course-002');
		expect(created.items.map((course) => course.props.createdAt)).toEqual([...created.items.map((course) => course.props.createdAt)].sort());
		expect(second.items).toHaveLength(3);
		expect(second.totalItems).toBe(13);
	});

	it('returns an empty list when nothing matches', async () => {
		const page = await createCourseCatalogRepository().search({ q: 'zzznomatch', page: 1, pageSize: 10, sort: 'title' });

		expect(page.items).toEqual([]);
		expect(page.totalItems).toBe(0);
		expect(page.totalPages).toBe(0);
		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
	});
});
