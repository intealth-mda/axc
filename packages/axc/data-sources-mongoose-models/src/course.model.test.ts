import { Mongoose } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { CourseModelFactory, CourseModelName, mongooseContextBuilder } from './index.ts';

const record = { id: 'one', title: 'Course', summary: 'Summary', modality: 'online', status: 'active', tags: ['ai'], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' };
describe('Course storage model without database', () => {
	const service = new Mongoose();
	const model = mongooseContextBuilder(service).Catalog.Course;
	it('registers an idempotent typed model and round trips all contract fields', () => {
		expect(model.modelName).toBe(CourseModelName);
		expect(CourseModelFactory(service)).toBe(model);
		const document = new model(record);
		expect(document.validateSync()).toBeUndefined();
		const { _id, ...stored } = document.toObject();
		expect(_id).toBeDefined();
		expect(stored).toEqual(record);
	});
	it.each([{ modality: 'bad' }, { status: 'bad' }, { title: '' }, { summary: '' }, { id: '' }, { tags: undefined }, { createdAt: 'bad' }, { updatedAt: 'bad' }])('enforces schema constraints %j', (patch) =>
		expect(new model({ ...record, ...patch }).validateSync()).toBeDefined());
});
