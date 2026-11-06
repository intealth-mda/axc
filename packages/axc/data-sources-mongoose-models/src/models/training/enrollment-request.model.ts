import type { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { Schema } from 'mongoose';

type Status = 'pending' | 'approved' | 'rejected' | 'cancelled';
interface HistoryRecord {
	fromStatus: Status | null;
	toStatus: Status;
	changedAt: string;
	changedBy: string;
	reason: string | null;
}
export interface EnrollmentRequestRecord {
	id: string;
	courseId: string;
	learnerEmail: string;
	justification: string;
	status: Status;
	createdAt: string;
	updatedAt: string;
	statusHistory: HistoryRecord[];
}
const statuses = ['pending', 'approved', 'rejected', 'cancelled'];
const HistorySchema = new Schema<HistoryRecord>(
	{
		fromStatus: { type: String, enum: [...statuses, null], default: null },
		toStatus: { type: String, enum: statuses, required: true },
		changedAt: { type: String, required: true },
		changedBy: { type: String, required: true },
		reason: { type: String, default: null },
	},
	{ _id: false },
);
export const EnrollmentRequestSchema = new Schema<EnrollmentRequestRecord>(
	{
		id: { type: String, required: true },
		courseId: { type: String, required: true },
		learnerEmail: { type: String, required: true, match: /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/ },
		justification: { type: String, required: true, minlength: 20, maxlength: 500 },
		status: { type: String, required: true, enum: statuses },
		createdAt: { type: String, required: true },
		updatedAt: { type: String, required: true },
		statusHistory: { type: [HistorySchema], required: true },
	},
	{ id: false },
);
export const EnrollmentRequestModelName = 'EnrollmentRequest';
export const EnrollmentRequestModelFactory = (factory: MongooseSeedwork.MongooseContextFactory) =>
	(factory.service.models[EnrollmentRequestModelName] as import('mongoose').Model<EnrollmentRequestRecord> | undefined) ?? factory.service.model<EnrollmentRequestRecord>(EnrollmentRequestModelName, EnrollmentRequestSchema);
export type EnrollmentRequestModelType = ReturnType<typeof EnrollmentRequestModelFactory>;
