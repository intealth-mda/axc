import type { Course, CourseSearchCriteria } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { Course as CourseService, InvalidCourseQueryError } from './index.ts';

function fakeCourse(): Course {
	return {
		id: 'course-001',
		props: {
			id: 'course-001',
			title: 'AI Security Foundations',
			summary: 'Introductory course on secure AI-assisted development.',
			modality: 'online',
			status: 'active',
			tags: ['ai', 'security'],
			createdAt: '2026-01-15T00:00:00.000Z',
			updatedAt: '2026-06-01T00:00:00.000Z',
		},
	} as unknown as Course;
}

function buildService(): { service: ReturnType<typeof CourseService>; seen(): CourseSearchCriteria | undefined; searched(): boolean } {
	let seenCriteria: CourseSearchCriteria | undefined;
	let calls = 0;
	const course = fakeCourse();
	const repository = {
		get(id: string): Promise<Course> {
			return Promise.resolve(course.id === id ? course : course);
		},
		save(item: Course): Promise<Course> {
			return Promise.resolve(item);
		},
		search(criteria: CourseSearchCriteria) {
			calls += 1;
			seenCriteria = criteria;
			return Promise.resolve({
				items: [course],
				page: criteria.page,
				pageSize: criteria.pageSize,
				totalItems: 1,
				totalPages: 1,
			});
		},
	};
	const dataSources: DataSources = {
		readonlyDataSource: { course: repository },
		domainDataSource: { course: repository },
	};
	return {
		service: CourseService(dataSources),
		seen: () => seenCriteria,
		searched: () => calls > 0,
	};
}

describe('course query validation', () => {
	it('defaults page, pageSize, and sort', async () => {
		const { service, seen } = buildService();

		const result = await service.search({});

		expect(seen()).toEqual({ page: 1, pageSize: 10, sort: 'title' });
		expect(result.items[0]?.id).toBe('course-001');
		expect(result.items[0]?.tags).toEqual(['ai', 'security']);
		expect(result.totalItems).toBe(1);
	});

	it('trims a keyword and keeps the requested page', async () => {
		const { service, seen } = buildService();

		await service.search({ q: '  security  ', page: '2', pageSize: '1', sort: ' updatedAt ' });

		expect(seen()).toEqual({ q: 'security', page: 2, pageSize: 1, sort: 'updatedAt' });
	});

	it('A9-modality boundary accepts in-person', async () => {
		const { service, seen } = buildService();

		await service.search({ modality: '  in-person  ' });

		expect(seen()?.modality).toBe('in-person');
	});

	it('A9-modality negative rejects remote', async () => {
		const { service, searched } = buildService();

		await expect(service.search({ modality: 'remote' })).rejects.toMatchObject({
			details: [{ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' }],
		});
		expect(searched()).toBe(false);
	});

	it('A9-status boundary accepts retired', async () => {
		const { service, seen } = buildService();

		await service.search({ status: 'retired' });

		expect(seen()?.status).toBe('retired');
	});

	it('A9-status negative rejects archived', async () => {
		const { service, searched } = buildService();

		await expect(service.search({ status: 'archived' })).rejects.toBeInstanceOf(InvalidCourseQueryError);
		expect(searched()).toBe(false);
	});

	it('A9-page boundary accepts 1', async () => {
		const { service, seen } = buildService();

		await service.search({ page: '1' });

		expect(seen()?.page).toBe(1);
	});

	it('A9-page negative rejects 0', async () => {
		const { service, searched } = buildService();

		await expect(service.search({ page: '0' })).rejects.toMatchObject({
			details: [{ field: 'page', message: 'page must be an integer greater than or equal to 1.' }],
		});
		expect(searched()).toBe(false);
	});

	it('A9-pageSize boundary accepts 1 and 50', async () => {
		const lower = buildService();
		const upper = buildService();

		await lower.service.search({ pageSize: '1' });
		await upper.service.search({ pageSize: '50' });

		expect(lower.seen()?.pageSize).toBe(1);
		expect(upper.seen()?.pageSize).toBe(50);
	});

	it('A9-pageSize negative rejects 0 and 51', async () => {
		const zero = buildService();
		const over = buildService();

		await expect(zero.service.search({ pageSize: '0' })).rejects.toMatchObject({
			details: [{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' }],
		});
		await expect(over.service.search({ pageSize: '51' })).rejects.toMatchObject({
			details: [{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' }],
		});
		expect(zero.searched()).toBe(false);
		expect(over.searched()).toBe(false);
	});

	it('A9-sort boundary accepts updatedAt', async () => {
		const { service, seen } = buildService();

		await service.search({ sort: 'updatedAt' });

		expect(seen()?.sort).toBe('updatedAt');
	});

	it('A9-sort negative rejects rank', async () => {
		const { service, searched } = buildService();

		await expect(service.search({ sort: 'rank' })).rejects.toMatchObject({
			details: [{ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' }],
		});
		expect(searched()).toBe(false);
	});

	it('A9 rejects the invalid field set without searching', async () => {
		const { service, searched } = buildService();

		try {
			await service.search({ modality: 'remote', status: 'archived', page: '0', pageSize: '51', sort: 'rank' });
			expect.fail('expected invalid query');
		} catch (error) {
			expect(error).toBeInstanceOf(InvalidCourseQueryError);
			if (!(error instanceof InvalidCourseQueryError)) {
				throw error;
			}
			expect(error.message).toBe('One or more query parameters are invalid.');
			expect(error.details.map((detail) => detail.field).sort()).toEqual(['modality', 'page', 'pageSize', 'sort', 'status']);
		}
		expect(searched()).toBe(false);
	});

	it('rejects a non-numeric page', async () => {
		const { service } = buildService();

		await expect(service.search({ page: 'abc', pageSize: '10.5' })).rejects.toBeInstanceOf(InvalidCourseQueryError);
	});
});
