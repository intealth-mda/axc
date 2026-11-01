import { buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

const app = createRestApp(buildApplicationServicesFactory({ environment: 'test' }));

interface CourseBody {
	items: { id: string; modality: string; status: string; tags: string[]; createdAt: string }[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

async function getCourses(query = '') {
	const response = await app.request(`/api/courses${query}`);
	const text = await response.text();
	// Keep non-JSON bodies (e.g. a 500 text page) so the status assertion reports the real failure.
	return { status: response.status, body: (text.startsWith('{') ? JSON.parse(text) : text) as CourseBody };
}

const ids = (body: CourseBody) => body.items.map((course) => course.id);

function invalid(field: string, message: unknown = expect.any(String)) {
	return {
		error: {
			code: 'INVALID_QUERY_PARAMETER',
			message: 'One or more query parameters are invalid.',
			details: [{ field, message }],
		},
	};
}

describe('GET /api/courses', () => {
	it('returns 200 with the default first page of 10 courses sorted by title', async () => {
		const { status, body } = await getCourses();
		expect(status).toBe(200);
		expect(body).toMatchObject({ page: 1, pageSize: 10, totalItems: 14, totalPages: 2 });
		expect(ids(body)).toEqual(['course-009', 'course-007', 'course-001', 'course-002', 'course-003', 'course-010', 'course-012', 'course-006', 'course-005', 'course-004']);
	});

	it('matches q=SECURITY case-insensitively across title, summary, and tags', async () => {
		const { status, body } = await getCourses('?q=SECURITY');
		expect(status).toBe(200);
		expect(ids(body)).toEqual(['course-001', 'course-003', 'course-005']);
	});

	it('returns only online courses for modality=online', async () => {
		const { status, body } = await getCourses('?modality=online');
		expect(status).toBe(200);
		expect(body.totalItems).toBe(5);
		expect(body.items.every((course) => course.modality === 'online')).toBe(true);
	});

	it('returns only active courses for status=active', async () => {
		const { status, body } = await getCourses('?status=active');
		expect(status).toBe(200);
		expect(body.totalItems).toBe(6);
		expect(body.items.every((course) => course.status === 'active')).toBe(true);
	});

	it('returns courses tagged ai for tag=ai', async () => {
		const { status, body } = await getCourses('?tag=ai');
		expect(status).toBe(200);
		expect(ids(body)).toEqual(['course-001', 'course-006', 'course-004', 'course-013']);
	});

	it('combines q, modality, status, tag, page, pageSize, and sort as in the API contract example', async () => {
		const { status, body } = await getCourses('?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title');
		expect(status).toBe(200);
		expect(body).toMatchObject({ page: 1, pageSize: 5, totalItems: 1, totalPages: 1 });
		expect(ids(body)).toEqual(['course-001']);
	});

	it('combines modality and status filters', async () => {
		const { status, body } = await getCourses('?modality=hybrid&status=active');
		expect(status).toBe(200);
		expect(ids(body)).toEqual(['course-012', 'course-006']);
	});

	it('returns page 2 of size 5 with pagination metadata', async () => {
		const { status, body } = await getCourses('?page=2&pageSize=5');
		expect(status).toBe(200);
		expect(body).toMatchObject({ page: 2, pageSize: 5, totalItems: 14, totalPages: 3 });
		expect(ids(body)).toEqual(['course-010', 'course-012', 'course-006', 'course-005', 'course-004']);
	});

	it('sorts by createdAt ascending for sort=createdAt', async () => {
		const { status, body } = await getCourses('?sort=createdAt&pageSize=50');
		expect(status).toBe(200);
		const createdAt = body.items.map((course) => course.createdAt);
		expect(createdAt).toEqual([...createdAt].sort());
		expect(body.items).toHaveLength(14);
	});

	it('returns 200 with empty items and valid metadata when nothing matches', async () => {
		const { status, body } = await getCourses('?q=zzz');
		expect(status).toBe(200);
		expect(body).toEqual({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
	});

	it.each([
		['modality', '?modality=virtual'],
		['status', '?status=archived'],
		['page', '?page=0'],
		['page', '?page=abc'],
		['sort', '?sort=price'],
	])('returns 400 with the error envelope for invalid %s (%s)', async (field, query) => {
		const { status, body } = await getCourses(query);
		expect(status).toBe(400);
		expect(body).toEqual(invalid(field));
	});

	it.each(['0', '51', 'abc'])('returns 400 with the exact pageSize message for pageSize=%s', async (pageSize) => {
		const { status, body } = await getCourses(`?pageSize=${pageSize}`);
		expect(status).toBe(400);
		expect(body).toEqual(invalid('pageSize', 'pageSize must be between 1 and 50.'));
	});

	it('returns one detail per invalid field in a single 400 response', async () => {
		const { status, body } = await getCourses('?page=0&pageSize=51&modality=x&status=y&sort=z');
		expect(status).toBe(400);
		expect((body as unknown as { error: { details: { field: string }[] } }).error.details.map((detail) => detail.field).sort()).toEqual(['modality', 'page', 'pageSize', 'sort', 'status']);
	});
});

describe('GET /health', () => {
	it('still returns the health contract', async () => {
		const response = await app.request('/health');
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ status: 'ok', service: 'agentCourses-api', projectCode: 'axc', environment: 'test' });
	});
});

describe('Authorization header', () => {
	function recordingApp() {
		const factory = buildApplicationServicesFactory({ environment: 'test' });
		const received: (string | undefined)[] = [];
		const recording: typeof factory = {
			...factory,
			forRequest: (...args: Parameters<typeof factory.forRequest>) => {
				received.push(...args);
				return factory.forRequest(...args);
			},
		};
		return { app: createRestApp(recording), received };
	}

	it('passes the Authorization header to forRequest for GET /api/courses and still returns results', async () => {
		const { app: authApp, received } = recordingApp();
		const response = await authApp.request('/api/courses', { headers: { Authorization: 'Bearer token-123' } });
		expect(received).toEqual(['Bearer token-123']);
		expect(response.status).toBe(200);
		expect(((await response.json()) as CourseBody).items).toHaveLength(10);
	});

	it('passes the Authorization header to forRequest for GET /health and still returns the contract', async () => {
		const { app: authApp, received } = recordingApp();
		const response = await authApp.request('/health', { headers: { Authorization: 'Bearer token-123' } });
		expect(received).toEqual(['Bearer token-123']);
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ status: 'ok', environment: 'test' });
	});
});
