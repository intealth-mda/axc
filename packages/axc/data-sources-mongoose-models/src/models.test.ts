import { Mongoose } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { CourseModelName, CourseSchema, EnrollmentRequestModelName, EnrollmentRequestSchema, mongooseContextBuilder } from './index.ts';

describe('storage schemas', () => {
	it('registers model factories idempotently and enforces course constraints', () => {
		const service = new Mongoose();
		const models = mongooseContextBuilder({ service });
		expect(models.Course.modelName).toBe(CourseModelName);
		expect(models.EnrollmentRequest.modelName).toBe(EnrollmentRequestModelName);
		expect(mongooseContextBuilder({ service }).Course).toBe(models.Course);
		expect(models.Course.schema).toBe(CourseSchema);
		expect(models.EnrollmentRequest.schema).toBe(EnrollmentRequestSchema);
		expect(new models.Course({ modality: 'bad', status: 'bad' }).validateSync()?.errors).toHaveProperty('modality');
	});
	it('validates enrollment constraints and preserves nested history', () => {
		const models = mongooseContextBuilder({ service: new Mongoose() });
		const record = {
			id: 'e',
			courseId: 'c',
			learnerEmail: 'a@example.org',
			justification: 'x'.repeat(20),
			status: 'pending',
			createdAt: '2026-01-01T00:00:00.000Z',
			updatedAt: '2026-01-01T00:00:00.000Z',
			statusHistory: [{ fromStatus: null, toStatus: 'pending', changedAt: '2026-01-01T00:00:00.000Z', changedBy: 'system', reason: null }],
		};
		const doc = new models.EnrollmentRequest(record);
		expect(doc.validateSync()).toBeUndefined();
		expect(doc.toObject().statusHistory).toEqual(record.statusHistory);
		const bad = new models.EnrollmentRequest({ ...record, learnerEmail: 'bad', justification: 'short', status: 'bad', statusHistory: [{ toStatus: 'bad' }] });
		const errors = bad.validateSync()?.errors;
		expect(errors).toHaveProperty('learnerEmail');
		expect(errors).toHaveProperty('justification');
		expect(errors).toHaveProperty('status');
		expect(errors).toHaveProperty('statusHistory.0.toStatus');
	});
});
