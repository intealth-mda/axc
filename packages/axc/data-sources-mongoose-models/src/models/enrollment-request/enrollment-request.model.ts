import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { type Model, Schema, type Types } from 'mongoose';

export interface EnrollmentRequestStatusHistory extends MongooseSeedwork.SubdocumentBase {
	fromStatus: string | null;
	toStatus: string;
	changedAt: string;
	changedBy: string;
	reason: string | null;
}
const EnrollmentRequestStatusHistorySchema = new Schema(
	{
		fromStatus: { type: String, required: false, default: null },
		toStatus: { type: String, required: true, minlength: 1, maxlength: 200 },
		changedAt: { type: String, required: true, minlength: 1, maxlength: 200 },
		changedBy: { type: String, required: true, minlength: 1, maxlength: 200 },
		reason: { type: String, required: false, default: null },
	},
	{ timestamps: true, versionKey: 'version' },
);

export interface EnrollmentRequest extends MongooseSeedwork.Base {
	courseId: string;
	learnerEmail: string;
	justification: string;
	status: 'pending' | 'approved' | 'rejected' | 'cancelled';
	statusHistory: Types.DocumentArray<EnrollmentRequestStatusHistory>;
}

const EnrollmentRequestSchema = new Schema<EnrollmentRequest, Model<EnrollmentRequest>, EnrollmentRequest>(
	{
		schemaVersion: { type: String, default: '1.0.0' },
		courseId: { type: String, required: true, minlength: 1, maxlength: 200 },
		learnerEmail: { type: String, required: true, minlength: 1, maxlength: 200 },
		justification: { type: String, required: true, minlength: 20, maxlength: 500 },
		status: { type: String, required: true },
		statusHistory: [EnrollmentRequestStatusHistorySchema],
	},
	{ timestamps: true, versionKey: 'version' },
);

export const EnrollmentRequestModelName = 'EnrollmentRequest';
export const EnrollmentRequestModelFactory = MongooseSeedwork.modelFactory<EnrollmentRequest>(EnrollmentRequestModelName, EnrollmentRequestSchema);
export type EnrollmentRequestModelType = ReturnType<typeof EnrollmentRequestModelFactory>;
