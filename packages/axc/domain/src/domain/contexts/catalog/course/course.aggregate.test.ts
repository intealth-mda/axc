import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';
import { searchCourses } from './course-search.ts';

const passport = { catalog: 'public' } as const;

function course(id: string, title: string, summary: string, tags: readonly string[]) {
	return Course.getNewInstance(
		{
			id,
			title,
			summary,
			modality: 'online',
			status: 'active',
			tags,
			createdAt: '2026-01-01T00:00:00.000Z',
			updatedAt: '2026-02-01T00:00:00.000Z',
		},
		passport,
	);
}

describe('Course aggregate', () => {
	it('creates a catalog course', () => {
		const created = Course.getNewInstance(
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
			passport,
		);

		expect(created.id).toBe('course-001');
		expect(created.title).toBe('AI Security Foundations');
		expect(created.summary).toBe('Introductory course on secure AI-assisted development.');
		expect(created.modality).toBe('online');
		expect(created.status).toBe('active');
		expect(created.tags).toEqual(['ai', 'security']);
		expect(created.createdAt).toBe('2026-01-15T00:00:00.000Z');
		expect(created.updatedAt).toBe('2026-06-01T00:00:00.000Z');
		expect(created.determineIf((permissions) => permissions.canReadCatalog)).toBe(true);
	});

	it('matches a keyword in title, summary, or tags regardless of case', () => {
		const page = searchCourses(
			[
				course('title-hit', 'Network SECURITY Basics', 'Routing lab', ['operations']),
				course('summary-hit', 'Privacy Operations', 'Controls for Security reviews', ['privacy']),
				course('tag-hit', 'Legacy Access Control', 'Retired workshop', ['Security']),
				course('miss', 'Safety Drills', 'Floor evacuation practice', ['safety']),
			],
			{ q: 'security', page: 1, pageSize: 10, sort: 'title' },
		);

		expect(page.items.map((item) => item.id)).toEqual(['tag-hit', 'title-hit', 'summary-hit']);
		expect(page.totalItems).toBe(3);
	});
});
