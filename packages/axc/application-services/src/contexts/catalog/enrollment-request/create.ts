import { EnrollmentRequest, type EnrollmentRequestStatus, enrollmentRequestStatuses, systemCatalogPassport } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { type EnrollmentFieldError, type EnrollmentRequestItem, toEnrollmentRequestItem } from './query-enrollment-requests.ts';

export class EnrollmentRequestError extends Error {
	readonly code: 'COURSE_NOT_FOUND' | 'COURSE_NOT_ACTIVE' | 'INVALID_REQUEST' | 'DUPLICATE_ACTIVE_REQUEST' | 'ENROLLMENT_REQUEST_NOT_FOUND' | 'INVALID_STATUS_TRANSITION';
	readonly statusCode: 400 | 404 | 409;
	readonly details: readonly EnrollmentFieldError[];
	public constructor(
		code: 'COURSE_NOT_FOUND' | 'COURSE_NOT_ACTIVE' | 'INVALID_REQUEST' | 'DUPLICATE_ACTIVE_REQUEST' | 'ENROLLMENT_REQUEST_NOT_FOUND' | 'INVALID_STATUS_TRANSITION',
		statusCode: 400 | 404 | 409,
		details: readonly EnrollmentFieldError[],
	) {
		super('The request could not be completed.');
		this.name = 'EnrollmentRequestError';
		this.code = code;
		this.statusCode = statusCode;
		this.details = details;
	}
}

export interface CreateEnrollmentRequestCommand {
	courseId: string;
	learnerEmail: string;
	justification: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function fieldErrors(details: readonly EnrollmentFieldError[]): EnrollmentRequestError {
	return new EnrollmentRequestError('INVALID_REQUEST', 400, details);
}

function isNotFound(error: unknown): boolean {
	return error instanceof Error && error.name === 'NotFoundError';
}

export const createEnrollmentRequest =
	(dataSources: DataSources) =>
	async (command: CreateEnrollmentRequestCommand): Promise<EnrollmentRequestItem> => {
		const details: EnrollmentFieldError[] = [];
		const courseId = command.courseId.trim();
		const learnerEmail = command.learnerEmail.trim();
		if (courseId === '') {
			details.push({ field: 'courseId', message: 'courseId is required.' });
		}
		if (!emailPattern.test(learnerEmail)) {
			details.push({ field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' });
		}
		if (command.justification.length < 20 || command.justification.length > 500) {
			details.push({ field: 'justification', message: 'justification must be between 20 and 500 characters.' });
		}
		if (details.length > 0 || courseId === '') {
			throw fieldErrors(details);
		}

		try {
			const course = await dataSources.readonlyDataSource.course.get(courseId);
			if (course.props.status !== 'active') {
				throw new EnrollmentRequestError('COURSE_NOT_ACTIVE', 409, [{ field: 'courseId', message: 'Enrollment requests require an active course.' }]);
			}
		} catch (error) {
			if (error instanceof EnrollmentRequestError) {
				throw error;
			}
			if (isNotFound(error)) {
				throw new EnrollmentRequestError('COURSE_NOT_FOUND', 404, [{ field: 'courseId', message: 'Course was not found.' }]);
			}
			throw error;
		}

		const existing = await dataSources.readonlyDataSource.enrollmentRequest.list();
		const duplicate = existing.some((request) => {
			const active = request.props.status === 'pending' || request.props.status === 'approved';
			return active && request.props.courseId === courseId && request.props.learnerEmail.toLowerCase() === learnerEmail.toLowerCase();
		});
		if (duplicate) {
			throw new EnrollmentRequestError('DUPLICATE_ACTIVE_REQUEST', 409, [{ field: 'learnerEmail', message: 'A learner may not have more than one pending or approved request for the same course.' }]);
		}

		const createdAt = new Date().toISOString();
		const request = EnrollmentRequest.requestNew(
			{
				id: `enroll-${String(existing.length + 1).padStart(3, '0')}`,
				courseId,
				learnerEmail,
				justification: command.justification,
				createdAt,
			},
			systemCatalogPassport,
		);
		await dataSources.domainDataSource.enrollmentRequest.withScopedTransaction(async (repository) => {
			await repository.save(request);
		});
		return toEnrollmentRequestItem(request.props);
	};

export function isEnrollmentStatus(value: string): value is EnrollmentRequestStatus {
	return enrollmentRequestStatuses.some((status) => status === value);
}
