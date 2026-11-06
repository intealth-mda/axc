import type { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { Schema } from 'mongoose';
export interface CourseRecord {
	id: string;
	title: string;
	summary: string;
	modality: 'online' | 'in-person' | 'hybrid';
	status: 'draft' | 'active' | 'retired';
	tags: string[];
	createdAt: string;
	updatedAt: string;
}
export const CourseSchema = new Schema<CourseRecord>(
	{
		id: { type: String, required: true },
		title: { type: String, required: true },
		summary: { type: String, required: true },
		modality: { type: String, enum: ['online', 'in-person', 'hybrid'], required: true },
		status: { type: String, enum: ['draft', 'active', 'retired'], required: true },
		tags: { type: [String], required: true },
		createdAt: { type: String, required: true },
		updatedAt: { type: String, required: true },
	},
	{ id: false },
);
export const CourseModelName = 'Course';
export const CourseModelFactory = (factory: MongooseSeedwork.MongooseContextFactory) =>
	(factory.service.models[CourseModelName] as import('mongoose').Model<CourseRecord> | undefined) ?? factory.service.model<CourseRecord>(CourseModelName, CourseSchema);
export type CourseModelType = ReturnType<typeof CourseModelFactory>;
