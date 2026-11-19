import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { type Model, Schema } from 'mongoose';

export interface Course extends MongooseSeedwork.Base {
	title: string;
	summary: string;
	modality: string;
	status: string;
	tags: string[];
}

const CourseSchema = new Schema<Course>(
	{
		schemaVersion: { type: String, default: '1.0.0' },
		title: { type: String, required: true, minlength: 1, maxlength: 100, trim: true },
		summary: { type: String, required: true, minlength: 1, maxlength: 500, trim: true },
		modality: { type: String, required: true, enum: ['online', 'in-person', 'hybrid'] },
		status: { type: String, required: true, enum: ['draft', 'active', 'retired'] },
		tags: {
			type: [String],
			required: true,
			validate: {
				validator: (values: string[]) => values.length <= 20 && values.every((value) => value.trim().length > 0 && value.trim().length <= 50),
				message: 'tags must contain at most 20 non-empty values of at most 50 characters',
			},
		},
	},
	{ timestamps: true, versionKey: 'version', collection: 'courses' },
);

export const CourseModelName = 'Course';
export const CourseModelFactory = MongooseSeedwork.modelFactory<Course>(CourseModelName, CourseSchema as unknown as Schema<Course, Model<Course>, Course>);
export type CourseModelType = ReturnType<typeof CourseModelFactory>;
