import { type Model, type Mongoose, Schema } from 'mongoose';
export interface StatusHistoryRecord {
	fromStatus: string | null;
	toStatus: string;
	changedAt: string;
	changedBy: string;
	reason: string | null;
}
export interface EnrollmentRequestRecord {
	id: string;
	courseId: string;
	learnerEmail: string;
	justification: string;
	status: 'pending' | 'approved' | 'rejected' | 'cancelled';
	createdAt: string;
	updatedAt: string;
	statusHistory: StatusHistoryRecord[];
}
export const EnrollmentRequestModelName = 'EnrollmentRequest';
const StatusHistorySchema = new Schema<StatusHistoryRecord>(
	{
		fromStatus: { type: String, default: null },
		toStatus: { type: String, required: true, enum: ['pending', 'approved', 'rejected', 'cancelled'] },
		changedAt: { type: String, required: true },
		changedBy: { type: String, required: true },
		reason: { type: String, default: null },
	},
	{ _id: false },
);
export const EnrollmentRequestSchema = new Schema<EnrollmentRequestRecord>({
	id: { type: String, required: true, unique: true },
	courseId: { type: String, required: true },
	learnerEmail: { type: String, required: true },
	justification: { type: String, required: true, minlength: 20, maxlength: 500 },
	status: { type: String, required: true, enum: ['pending', 'approved', 'rejected', 'cancelled'] },
	createdAt: { type: String, required: true },
	updatedAt: { type: String, required: true },
	statusHistory: { type: [StatusHistorySchema], required: true },
});
export const createEnrollmentRequestModel = (connection: Mongoose): Model<EnrollmentRequestRecord> => connection.model<EnrollmentRequestRecord>(EnrollmentRequestModelName, EnrollmentRequestSchema);
