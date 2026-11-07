import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { mongooseContextBuilder } from './index.ts';

describe('models', () => {
	it('registers typed course and enrollment schemas with nested history', async () => {
		const models = mongooseContextBuilder(new mongoose.Mongoose());
		expect(models.Course.modelName).toBe('Course');
		expect(models.EnrollmentRequest.modelName).toBe('EnrollmentRequest');
		const item = new models.EnrollmentRequest({
			id: 'e',
			courseId: 'c',
			learnerEmail: 'u@e.org',
			justification: 'This course supports my work.',
			status: 'pending',
			createdAt: 'now',
			updatedAt: 'now',
			statusHistory: [{ fromStatus: null, toStatus: 'pending', changedAt: 'now', changedBy: 'system', reason: null }],
		});
		expect(await item.validate()).toBeUndefined();
		expect(item.toObject().statusHistory).toHaveLength(1);
	});
});
