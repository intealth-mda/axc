import { buildApplicationServicesFactory, type CoursePage } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

interface ErrorBody {
	error: {
		code: string;
		message: string;
		details: Array<{ field: string; message: string }>;
	};
}

const app = createRestApp(buildApplicationServicesFactory({ environment: 'test' }));

async function getJson(path: string): Promise<{ status: number; body: CoursePage }> {
	const response = await app.request(`http://localhost${path}`);
	return { status: response.status, body: (await response.json()) as CoursePage };
}

async function getError(path: string): Promise<{ status: number; body: ErrorBody }> {
	const response = await app.request(`http://localhost${path}`);
	return { status: response.status, body: (await response.json()) as ErrorBody };
}

function ids(body: CoursePage): string[] {
	return body.items.map((item) => item.id);
}

describe('GET /api/courses', () => {
	it('keeps the health route available', async () => {
		const response = await app.request('http://localhost/health');
		expect(response.status).toBe(200);
		const body = (await response.json()) as { status: string; service: string };
		expect(body.status).toBe('ok');
		expect(body.service).toBe('agentCourses-api');
	});

	it('returns the first page sorted by title', async () => {
		const { status, body } = await getJson('/api/courses');
		expect(status).toBe(200);
		expect(body.page).toBe(1);
		expect(body.pageSize).toBe(10);
		expect(body.totalItems).toBe(13);
		expect(body.totalPages).toBe(2);
		expect(body.items).toHaveLength(10);
		expect(body.items.map((item) => item.title)).toEqual([
			'Accessible Content',
			'AI Security Foundations',
			'API Testing',
			'Classroom Presentation',
			'Cloud Operations',
			'Data Privacy Basics',
			'Draft Prompt Design',
			'Gardening Basics',
			'Hybrid Facilitation',
			'Incident Drills',
		]);
		expect(body.items[1]).toMatchObject({
			id: 'course-001',
			modality: 'online',
			status: 'active',
			tags: ['ai', 'security'],
			createdAt: '2026-01-15T00:00:00.000Z',
			updatedAt: '2026-06-01T00:00:00.000Z',
		});
	});

	it('matches a keyword in title, summary, or tags regardless of case', async () => {
		const lower = await getJson('/api/courses?q=security');
		const upper = await getJson('/api/courses?q=SECURITY');
		expect(lower.status).toBe(200);
		expect(ids(lower.body).sort()).toEqual(['course-001', 'course-006', 'course-009', 'course-011']);
		expect(ids(upper.body).sort()).toEqual(ids(lower.body).sort());

		const summary = await getJson('/api/courses?q=WINDOWSILL');
		expect(ids(summary.body)).toEqual(['course-012']);

		const tag = await getJson('/api/courses?q=hobbies');
		expect(ids(tag.body)).toEqual(['course-012']);
	});

	it('filters by modality, status, and tag', async () => {
		const online = await getJson('/api/courses?modality=online');
		expect(ids(online.body).sort()).toEqual(['course-001', 'course-004', 'course-006', 'course-009', 'course-013']);
		expect(online.body.items.every((item) => item.modality === 'online')).toBe(true);

		const active = await getJson('/api/courses?status=active');
		expect(active.body.totalItems).toBe(8);
		expect(active.body.items.every((item) => item.status === 'active')).toBe(true);

		const tag = await getJson('/api/courses?tag=AI');
		expect(ids(tag.body).sort()).toEqual(['course-001', 'course-004']);

		const securityTag = await getJson('/api/courses?tag=security');
		expect(ids(securityTag.body).sort()).toEqual(['course-001', 'course-009', 'course-011']);
	});

	it('combines keyword, modality, and status filters', async () => {
		const { status, body } = await getJson('/api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title');
		expect(status).toBe(200);
		expect(body.page).toBe(1);
		expect(body.pageSize).toBe(5);
		expect(body.totalItems).toBe(1);
		expect(body.totalPages).toBe(1);
		expect(body.items).toEqual([
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
		]);

		const combined = await getJson('/api/courses?q=security&modality=online&status=active');
		expect(ids(combined.body).sort()).toEqual(['course-001', 'course-006']);
	});

	it('pages through the catalog', async () => {
		const first = await getJson('/api/courses?page=1&pageSize=5');
		expect(first.body.items).toHaveLength(5);
		expect(first.body.page).toBe(1);
		expect(first.body.pageSize).toBe(5);
		expect(first.body.totalItems).toBe(13);
		expect(first.body.totalPages).toBe(3);

		const second = await getJson('/api/courses?page=2&pageSize=10');
		expect(second.body.items).toHaveLength(3);
		expect(second.body.page).toBe(2);
		expect(second.body.totalPages).toBe(2);

		const wide = await getJson('/api/courses?pageSize=50');
		expect(wide.body.items).toHaveLength(13);
		expect(wide.body.pageSize).toBe(50);
	});

	it('sorts by createdAt', async () => {
		const { body } = await getJson('/api/courses?sort=createdAt&pageSize=13');
		expect(body.items.map((item) => item.id)).toEqual([
			'course-005',
			'course-009',
			'course-008',
			'course-013',
			'course-001',
			'course-006',
			'course-002',
			'course-003',
			'course-004',
			'course-007',
			'course-010',
			'course-011',
			'course-012',
		]);
		const timestamps = body.items.map((item) => item.createdAt);
		expect([...timestamps].sort()).toEqual(timestamps);
	});

	it('returns 400 for invalid query parameters', async () => {
		const modality = await getError('/api/courses?modality=remote');
		expect(modality.status).toBe(400);
		expect(modality.body.error.code).toBe('INVALID_QUERY_PARAMETER');
		expect(modality.body.error.details).toEqual([{ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' }]);

		const status = await getError('/api/courses?status=published');
		expect(status.status).toBe(400);
		expect(status.body.error.details[0]?.field).toBe('status');

		const page = await getError('/api/courses?page=0');
		expect(page.status).toBe(400);
		expect(page.body.error.details).toEqual([{ field: 'page', message: 'page must be an integer greater than or equal to 1.' }]);

		const pageSize = await getError('/api/courses?pageSize=51');
		expect(pageSize.status).toBe(400);
		expect(pageSize.body).toEqual({
			error: {
				code: 'INVALID_QUERY_PARAMETER',
				message: 'One or more query parameters are invalid.',
				details: [{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' }],
			},
		});

		const sort = await getError('/api/courses?sort=name');
		expect(sort.status).toBe(400);
		expect(sort.body.error.details[0]?.field).toBe('sort');

		const combined = await getError('/api/courses?modality=no&pageSize=0');
		expect(combined.status).toBe(400);
		expect(combined.body.error.details.map((detail) => detail.field)).toEqual(['pageSize', 'modality']);
	});

	it('returns an empty page when nothing matches', async () => {
		const { status, body } = await getJson('/api/courses?q=not-a-course');
		expect(status).toBe(200);
		expect(body.items).toEqual([]);
		expect(body.page).toBe(1);
		expect(body.pageSize).toBe(10);
		expect(body.totalItems).toBe(0);
		expect(body.totalPages).toBe(0);
	});
});
