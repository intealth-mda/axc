import { type Model, type Mongoose, Schema } from 'mongoose';

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
const isoDate = (value: string) => Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
export const CourseSchema = new Schema<CourseRecord>(
	{
		id: { type: String, required: true },
		title: { type: String, required: true },
		summary: { type: String, required: true },
		modality: { type: String, required: true, enum: ['online', 'in-person', 'hybrid'] },
		status: { type: String, required: true, enum: ['draft', 'active', 'retired'] },
		tags: { type: [String], required: true, default: undefined },
		createdAt: { type: String, required: true, validate: isoDate },
		updatedAt: { type: String, required: true, validate: isoDate },
	},
	{ id: false, versionKey: false },
);
export const CourseModelName = 'Course';
export const CourseModelFactory = (service: Mongoose): Model<CourseRecord> => (service.models[CourseModelName] as Model<CourseRecord> | undefined) ?? service.model<CourseRecord>(CourseModelName, CourseSchema);
export type CourseModelType = ReturnType<typeof CourseModelFactory>;
