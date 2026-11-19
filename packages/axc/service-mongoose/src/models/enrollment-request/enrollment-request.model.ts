import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { type Model, Schema, type Types } from 'mongoose';

export interface StatusHistoryDoc {
	fromStatus: string | null;
	toStatus: string;
	changedAt: string;
	changedBy: string;
	reason: string | null;
}

export interface EnrollmentRequest extends MongooseSeedwork.Base {
	courseId: Types.ObjectId;
	learnerEmail: string;
	justification: string;
	status: string;
	statusHistory: StatusHistoryDoc[];
}

const StatusHistorySchema = new Schema<StatusHistoryDoc>(
	{
		fromStatus: { type: String, required: false, default: null, maxlength: 9 },
		toStatus: { type: String, required: true, minlength: 1, maxlength: 9, enum: ['pending', 'approved', 'rejected', 'cancelled'] },
		changedAt: { type: String, required: true, minlength: 1 },
		changedBy: { type: String, required: true, minlength: 1 },
		reason: { type: String, required: false, default: null, maxlength: 500 },
	},
	{ _id: false, timestamps: true, versionKey: 'version' },
);

const EnrollmentRequestSchema = new Schema<EnrollmentRequest>(
	{
		schemaVersion: { type: String, default: '1.0.0' },
		courseId: { type: Schema.Types.ObjectId, required: true },
		learnerEmail: { type: String, required: true, minlength: 1, maxlength: 319, trim: true },
		justification: { type: String, required: true, minlength: 20, maxlength: 500, trim: true },
		status: { type: String, required: true, enum: ['pending', 'approved', 'rejected', 'cancelled'] },
		statusHistory: { type: [StatusHistorySchema], required: true },
	},
	{ timestamps: true, versionKey: 'version', collection: 'enrollmentrequests' },
);

export const EnrollmentRequestModelName = 'EnrollmentRequest';
export const EnrollmentRequestModelFactory = MongooseSeedwork.modelFactory<EnrollmentRequest>(
	EnrollmentRequestModelName,
	EnrollmentRequestSchema as unknown as Schema<EnrollmentRequest, Model<EnrollmentRequest>, EnrollmentRequest>,
);
export type EnrollmentRequestModelType = ReturnType<typeof EnrollmentRequestModelFactory>;
