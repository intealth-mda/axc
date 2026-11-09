import { createDataSources } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { Training } from './contexts/training/index.ts';

const fresh = () => Training(createDataSources());
const command = { courseId: 'course-001', learnerEmail: 'learner@example.org', justification: 'I need this course for my upcoming development work.' };
describe('course search application boundary', () => {
	it('paginates and applies each filter and two discriminating combinations', async () => {
		const api = fresh().Course;
		const ids = async (query: Parameters<typeof api.search>[0]) => (await api.search({ pageSize: 50, ...query })).items.map((row) => row.id);
		expect(await api.search({})).toMatchObject({ page: 1, pageSize: 10, totalItems: 12, totalPages: 2 });
		expect((await api.search({})).items).toHaveLength(10);
		expect(await ids({ q: 'SeCuRiTy' })).toEqual(['course-001', 'course-003', 'course-008', 'course-005', 'course-012', 'course-002']);
		expect(await ids({ modality: 'online' })).toEqual(['course-001', 'course-003', 'course-008', 'course-004', 'course-011']);
		expect(await ids({ status: 'active' })).toEqual(['course-001', 'course-008', 'course-006', 'course-004', 'course-012', 'course-002', 'course-009', 'course-010']);
		expect(await ids({ tag: 'AI' })).toEqual(['course-001', 'course-003', 'course-006']);
		expect(await ids({ q: 'security', modality: 'online', status: 'active' })).toEqual(['course-001', 'course-008']);
		expect(await ids({ tag: 'ai', modality: 'hybrid', status: 'active' })).toEqual(['course-006']);
		const all = await ids({});
		expect((await api.search({ page: 2, pageSize: 5 })).items.map((row) => row.id)).toEqual(all.slice(5, 10));
		expect(await api.search({ q: 'nonexistent' })).toEqual({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
		for (const sort of ['title', 'createdAt', 'updatedAt'] as const) {
			const rows = (await api.search({ sort, pageSize: 50 })).items;
			expect(rows.map((row) => row[sort])).toEqual(rows.map((row) => row[sort]).toSorted((a, b) => a.localeCompare(b)));
		}
	});
	it.each([
		{ modality: 'bad' },
		{ status: 'bad' },
		{ sort: 'bad' },
		{ page: 0 },
		{ page: -1 },
		{ page: '1.1' },
		{ page: '2e0' },
		{ pageSize: 51 },
		{ pageSize: 'bad' },
		{ q: '' },
		{ tag: [] },
		{ unknown: 'x' },
		null,
	])('rejects invalid runtime query %s', async (query) => {
		await expect(fresh().Course.search(query as never)).rejects.toMatchObject({ code: 'INVALID_QUERY_PARAMETER' });
	});
});
describe('enrollment application boundary', () => {
	it('creates, retrieves, changes status, normalizes email and prevents pending/approved duplicates', async () => {
		const api = fresh().EnrollmentRequest;
		const item = await api.create({ ...command, learnerEmail: ' Learner@Example.org ' });
		expect(item).toMatchObject({ ...command, status: 'pending' });
		expect(item.createdAt).toBe(item.updatedAt);
		expect(item.statusHistory).toEqual([{ fromStatus: null, toStatus: 'pending', changedAt: item.createdAt, changedBy: 'system', reason: null }]);
		expect(await api.getById({ id: item.id })).toEqual(item);
		await expect(api.create(command)).rejects.toMatchObject({ code: 'DUPLICATE_ACTIVE_REQUEST' });
		const approved = await api.changeStatus({ id: item.id, status: 'approved', changedBy: 'reviewer' });
		expect(approved.statusHistory).toHaveLength(2);
		await expect(api.create(command)).rejects.toMatchObject({ code: 'DUPLICATE_ACTIVE_REQUEST' });
		await api.changeStatus({ id: item.id, status: 'cancelled', changedBy: 'reviewer' });
		expect((await api.create(command)).id).not.toBe(item.id);
	});
	it.each([
		{ courseId: 'missing', code: 'COURSE_NOT_FOUND' },
		{ courseId: 'course-003', code: 'COURSE_NOT_ACTIVE' },
		{ courseId: 'course-005', code: 'COURSE_NOT_ACTIVE' },
		{ learnerEmail: 'bad', code: 'INVALID_REQUEST' },
		{ justification: 'short', code: 'INVALID_REQUEST' },
		{ justification: 'x'.repeat(501), code: 'INVALID_REQUEST' },
		{ courseId: 5, code: 'INVALID_REQUEST' },
	])('rejects creation %s without persisting', async ({ code, ...bad }) => {
		const api = fresh().EnrollmentRequest;
		await expect(api.create({ ...command, ...bad } as never)).rejects.toMatchObject({ code });
		expect(await api.list({})).toEqual([]);
	});
	it('filters each field independently against discriminating counterexamples', async () => {
		const api = fresh().EnrollmentRequest;
		const a = await api.create(command);
		const b = await api.create({ ...command, learnerEmail: 'other@example.org' });
		const c = await api.create({ ...command, courseId: 'course-002' });
		await api.changeStatus({ id: b.id, status: 'approved', changedBy: 'reviewer' });
		const ids = async (query: Parameters<typeof api.list>[0]) => (await api.list(query)).map((row) => row.id);
		expect(await ids({ status: 'pending' })).toEqual([a.id, c.id]);
		expect(await ids({ courseId: 'course-001' })).toEqual([a.id, b.id]);
		expect(await ids({ learnerEmail: 'LEARNER@EXAMPLE.ORG' })).toEqual([a.id, c.id]);
		expect(await ids({ status: 'pending', courseId: 'course-001', learnerEmail: command.learnerEmail })).toEqual([a.id]);
	});
	it('validates every public operation directly and preserves state/history on failed mutations', async () => {
		const api = fresh().EnrollmentRequest;
		const item = await api.create(command);
		for (const query of [{ status: 'bad' }, { learnerEmail: 'bad' }, { courseId: '' }, { status: [] }, { unknown: 'x' }, null]) await expect(api.list(query as never)).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(api.getById({ id: '' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(api.getById({ id: 'missing' })).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
		for (const bad of [
			{ status: 'bad', changedBy: 'reviewer' },
			{ status: 'rejected', changedBy: 'reviewer' },
			{ status: 'rejected', changedBy: 'reviewer', reason: ' ' },
			{ status: 'approved', changedBy: '' },
			{ status: 'approved', changedBy: 1 },
		]) {
			await expect(api.changeStatus({ id: item.id, ...bad } as never)).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
			expect(await api.getById({ id: item.id })).toEqual(item);
		}
		await expect(api.changeStatus({ id: 'missing', status: 'approved', changedBy: 'reviewer' })).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
		const rejected = await api.changeStatus({ id: item.id, status: 'rejected', changedBy: 'reviewer', reason: 'Prerequisite missing' });
		await expect(api.changeStatus({ id: item.id, status: 'approved', changedBy: 'reviewer' })).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
		expect(await api.getById({ id: item.id })).toEqual(rejected);
		expect((await api.create(command)).id).not.toBe(item.id);
	});
	it('prevents duplicates across concurrent application calls', async () => {
		const api = fresh().EnrollmentRequest;
		const results = await Promise.allSettled(Array.from({ length: 5 }, () => api.create(command)));
		expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
		expect(await api.list({})).toHaveLength(1);
	});
});
