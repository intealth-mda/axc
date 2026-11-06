export const enrollmentStatuses = ['pending', 'approved', 'rejected', 'cancelled'] as const;
export type EnrollmentStatus = (typeof enrollmentStatuses)[number];
export interface CreateEnrollmentInput {
	courseId: string;
	learnerEmail: string;
	justification: string;
}
export interface UpdateEnrollmentInput {
	status: string;
	changedBy: string;
	reason?: string | undefined;
}
export interface EnrollmentFilter {
	status?: string | undefined;
	courseId?: string | undefined;
	learnerEmail?: string | undefined;
}
export class EnrollmentValidationError extends Error {
	readonly details: { field: string; message: string }[];
	constructor(details: { field: string; message: string }[]) {
		super('The request could not be completed.');
		this.name = 'EnrollmentValidationError';
		this.details = details;
	}
}
export class EnrollmentConflictError extends Error {
	readonly code: 'COURSE_NOT_ACTIVE' | 'DUPLICATE_ACTIVE_REQUEST' | 'INVALID_STATUS_TRANSITION';
	constructor(code: EnrollmentConflictError['code']) {
		super(code);
		this.name = 'EnrollmentConflictError';
		this.code = code;
	}
}
const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export function assertCreateEnrollment(input: CreateEnrollmentInput): void {
	const details: { field: string; message: string }[] = [];
	if (!input.courseId.trim()) details.push({ field: 'courseId', message: 'courseId is required.' });
	if (!validEmail(input.learnerEmail.trim())) details.push({ field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' });
	if (input.justification.trim().length < 20 || input.justification.trim().length > 500) details.push({ field: 'justification', message: 'justification must be between 20 and 500 characters.' });
	if (details.length) throw new EnrollmentValidationError(details);
}
export function assertUpdateEnrollment(input: UpdateEnrollmentInput): asserts input is UpdateEnrollmentInput & { status: EnrollmentStatus } {
	const details: { field: string; message: string }[] = [];
	if (!enrollmentStatuses.some((status) => status === input.status)) details.push({ field: 'status', message: 'Invalid status value.' });
	if (!input.changedBy.trim()) details.push({ field: 'changedBy', message: 'changedBy is required.' });
	if (input.status === 'rejected' && !input.reason?.trim()) details.push({ field: 'reason', message: 'Rejection requires a reason.' });
	if (details.length) throw new EnrollmentValidationError(details);
}
export function assertEnrollmentFilter(input: EnrollmentFilter): void {
	const details: { field: string; message: string }[] = [];
	if (input.status !== undefined && !enrollmentStatuses.some((status) => status === input.status)) details.push({ field: 'status', message: 'Invalid status value.' });
	if (input.courseId !== undefined && !input.courseId.trim()) details.push({ field: 'courseId', message: 'courseId must not be empty.' });
	if (input.learnerEmail !== undefined && !validEmail(input.learnerEmail.trim())) details.push({ field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' });
	if (details.length) throw new EnrollmentValidationError(details);
}
