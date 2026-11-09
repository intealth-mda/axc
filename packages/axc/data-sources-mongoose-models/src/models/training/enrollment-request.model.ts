import { type Connection, type Model, Schema } from 'mongoose';
export interface HistoryRecord {
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
	status: string;
	createdAt: string;
	updatedAt: string;
	statusHistory: HistoryRecord[];
}
const statuses = ['pending', 'approved', 'rejected', 'cancelled'];
const history = new Schema<HistoryRecord>(
	{
		fromStatus: { type: String, enum: [...statuses, null], default: null },
		toStatus: { type: String, enum: statuses, required: true },
		changedAt: { type: String, required: true },
		changedBy: { type: String, required: true },
		reason: { type: String, default: null },
	},
	{ _id: false },
);
export const EnrollmentRequestModelName = 'EnrollmentRequest';
export const EnrollmentRequestSchema = new Schema<EnrollmentRequestRecord>(
	{
		id: { type: String, required: true },
		courseId: { type: String, required: true },
		learnerEmail: { type: String, required: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
		justification: { type: String, required: true, minlength: 20, maxlength: 500 },
		status: { type: String, required: true, enum: statuses },
		createdAt: { type: String, required: true },
		updatedAt: { type: String, required: true },
		statusHistory: { type: [history], required: true },
	},
	{ id: false },
);
export const EnrollmentRequestModelFactory = (connection: Connection): Model<EnrollmentRequestRecord> =>
	(connection.models[EnrollmentRequestModelName] as Model<EnrollmentRequestRecord> | undefined) ?? connection.model(EnrollmentRequestModelName, EnrollmentRequestSchema);
