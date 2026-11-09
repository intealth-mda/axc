import { type Connection, type Model, Schema } from 'mongoose';
export interface CourseRecord {
	id: string;
	title: string;
	summary: string;
	modality: string;
	status: string;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}
export const CourseModelName = 'Course';
export const CourseSchema = new Schema<CourseRecord>(
	{
		id: { type: String, required: true },
		title: { type: String, required: true },
		summary: { type: String, required: true },
		modality: { type: String, required: true, enum: ['online', 'in-person', 'hybrid'] },
		status: { type: String, required: true, enum: ['draft', 'active', 'retired'] },
		tags: { type: [String], required: true },
		createdAt: { type: String, required: true },
		updatedAt: { type: String, required: true },
	},
	{ id: false },
);
export const CourseModelFactory = (connection: Connection): Model<CourseRecord> => (connection.models[CourseModelName] as Model<CourseRecord> | undefined) ?? connection.model(CourseModelName, CourseSchema);
