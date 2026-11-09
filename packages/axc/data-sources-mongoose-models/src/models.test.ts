import { createConnection } from 'mongoose';
import { expect, it } from 'vitest';
import { CourseModelName, EnrollmentRequestModelName, mongooseContextBuilder } from './index.ts';

it('registers reusable models without connecting and validates course constraints', () => {
	const connection = createConnection();
	const models = mongooseContextBuilder(connection);
	expect(models.Course.modelName).toBe(CourseModelName);
	expect(models.EnrollmentRequest.modelName).toBe(EnrollmentRequestModelName);
	expect(mongooseContextBuilder(connection).Course).toBe(models.Course);
	const fields = { id: 'c', title: 'Course', summary: 'Summary', modality: 'online', status: 'active', tags: ['ai'], createdAt: 'now', updatedAt: 'now' };
	expect(new models.Course(fields).validateSync()).toBeUndefined();
	for (const bad of [{ modality: 'invalid' }, { status: 'invalid' }, { title: '' }]) expect(new models.Course({ ...fields, ...bad }).validateSync()).toBeDefined();
});
it('preserves nested audit records and rejects invalid storage fields', () => {
	const models = mongooseContextBuilder(createConnection());
	const fields = {
		id: 'e',
		courseId: 'c',
		learnerEmail: 'a@b.org',
		justification: 'x'.repeat(20),
		status: 'rejected',
		createdAt: 'now',
		updatedAt: 'later',
		statusHistory: [
			{ fromStatus: null, toStatus: 'pending', changedAt: 'now', changedBy: 'system', reason: null },
			{ fromStatus: 'pending', toStatus: 'rejected', changedAt: 'later', changedBy: 'reviewer', reason: 'Missing prerequisite' },
		],
	};
	const document = new models.EnrollmentRequest(fields);
	expect(document.validateSync()).toBeUndefined();
	expect(document.toObject().statusHistory).toEqual(fields.statusHistory);
	for (const bad of [{ status: 'invalid' }, { learnerEmail: 'bad' }, { justification: 'short' }, { justification: 'x'.repeat(501) }, { statusHistory: [{ ...fields.statusHistory[0], toStatus: 'invalid' }] }])
		expect(new models.EnrollmentRequest({ ...fields, ...bad }).validateSync()).toBeDefined();
});
