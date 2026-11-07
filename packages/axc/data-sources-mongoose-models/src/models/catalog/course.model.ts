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
export const CourseModelName = 'Course';
export const CourseSchema = new Schema<CourseRecord>({
	id: { type: String, required: true, unique: true },
	title: { type: String, required: true },
	summary: { type: String, required: true },
	modality: { type: String, enum: ['online', 'in-person', 'hybrid'], required: true },
	status: { type: String, enum: ['draft', 'active', 'retired'], required: true },
	tags: { type: [String], required: true },
	createdAt: { type: String, required: true },
	updatedAt: { type: String, required: true },
});
export const createCourseModel = (connection: Mongoose): Model<CourseRecord> => connection.model<CourseRecord>(CourseModelName, CourseSchema);
