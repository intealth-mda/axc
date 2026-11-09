import { Domain } from '@axc/domain';
import { describe, expect, it } from 'vitest';
import { courses } from '../../../../seed/training/course.ts';
import { courseReadRepository } from './course.read-repository.ts';

const repo = courseReadRepository(courses);
const defaults = { page: 1, pageSize: 10, sort: 'title' };
describe('course search', () => {
	it('returns 12 seeded courses with default pagination and all required fields', async () => {
		const page = await repo.search(defaults);
		expect(page).toMatchObject({ page: 1, pageSize: 10, totalItems: 12, totalPages: 2 });
		expect(page.items).toHaveLength(10);
		expect(Object.keys(page.items[0] ?? {}).sort()).toEqual(['id', 'title', 'summary', 'modality', 'status', 'tags', 'createdAt', 'updatedAt'].sort());
		expect(new Set(courses.map((c) => c.modality))).toEqual(new Set(Domain.Contexts.Training.Course.courseModalities));
		expect(new Set(courses.map((c) => c.status))).toEqual(new Set(Domain.Contexts.Training.Course.courseStatuses));
	});
	it('matches keyword across title, summary and tags regardless of case', async () => {
		const title = await repo.search({ ...defaults, q: 'AI SECURITY FOUNDATIONS' });
		expect(title.items.map((c) => c.id)).toEqual(['course-001']);
		expect((await repo.search({ ...defaults, q: 'CONNECTIVITY' })).items.map((c) => c.id)).toEqual(['course-011']);
		expect((await repo.search({ ...defaults, q: 'MAINTENANCE' })).items.map((c) => c.id)).toEqual(['course-005']);
	});
	it('applies individual and combined filters', async () => {
		expect((await repo.search({ ...defaults, modality: 'online' })).items.map((c) => c.id)).toEqual(['course-001', 'course-004', 'course-011', 'course-006', 'course-008']);
		expect((await repo.search({ ...defaults, status: 'draft' })).items.map((c) => c.id)).toEqual(['course-004', 'course-009']);
		expect((await repo.search({ ...defaults, tag: 'AI' })).items.map((c) => c.id)).toEqual(['course-007', 'course-001']);
		expect((await repo.search({ ...defaults, q: 'SECURITY', modality: 'online', status: 'active' })).items.map((c) => c.id)).toEqual(['course-001', 'course-008']);
		expect((await repo.search({ ...defaults, modality: 'hybrid', status: 'active', tag: 'ai' })).items.map((c) => c.id)).toEqual(['course-007']);
	});
	it('paginates, orders all sort fields, handles empty and distant pages', async () => {
		const first = await repo.search({ ...defaults, pageSize: 5 });
		const second = await repo.search({ ...defaults, pageSize: 5, page: 2 });
		expect(first.items).toHaveLength(5);
		expect(second.items).toHaveLength(5);
		expect(first.totalPages).toBe(3);
		expect(second.items.some((c) => first.items.some((a) => a.id === c.id))).toBe(false);
		for (const sort of ['title', 'createdAt', 'updatedAt'] as const) {
			const page = await repo.search({ ...defaults, pageSize: 50, sort });
			expect(page.items).toHaveLength(12);
			const values = page.items.map((c) => c[sort]);
			expect(values).toEqual([...values].sort((a, b) => a.localeCompare(b)));
		}
		expect(await repo.search({ ...defaults, q: 'no-such-course' })).toMatchObject({ items: [], totalItems: 0, totalPages: 0 });
		expect((await repo.search({ ...defaults, page: Number.MAX_SAFE_INTEGER })).items).toEqual([]);
	});
	it('copies entities and nested tags on search and lookup', async () => {
		const found = await repo.getById('course-001');
		found?.tags.push('mutated');
		const page = await repo.search(defaults);
		page.items[0]?.tags.push('mutated');
		expect((await repo.getById('course-001'))?.tags).toEqual(['ai', 'security']);
		expect((await repo.search(defaults)).items[0]?.tags).not.toContain('mutated');
		expect(await repo.getById('missing')).toBeUndefined();
	});
});
