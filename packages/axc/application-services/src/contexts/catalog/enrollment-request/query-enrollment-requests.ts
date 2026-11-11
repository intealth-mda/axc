import type { EnrollmentRequestProps, EnrollmentRequestStatus } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { EnrollmentRequestError, isEnrollmentStatus } from './create.ts';

export interface EnrollmentFieldError {
	field: string;
	message: string;
}

export interface EnrollmentRequestItem {
	id: string;
	courseId: string;
	learnerEmail: string;
	justification: string;
	status: EnrollmentRequestStatus;
	createdAt: string;
	updatedAt: string;
	statusHistory: EnrollmentRequestProps['statusHistory'];
}

export interface EnrollmentRequestListQuery {
	status?: EnrollmentRequestStatus;
	courseId?: string;
	learnerEmail?: string;
}

type ParseListResult = { ok: true; query: EnrollmentRequestListQuery } | { ok: false; details: EnrollmentFieldError[] };

const allowedFields = ['status', 'courseId', 'learnerEmail'] as const;

function readParam(params: Readonly<Record<string, string>>, key: string): string | undefined {
	// biome-ignore lint/complexity/useLiteralKeys: index signature key
	return params[key];
}

export function toEnrollmentRequestItem(props: EnrollmentRequestProps): EnrollmentRequestItem {
	return {
		id: props.id,
		courseId: props.courseId,
		learnerEmail: props.learnerEmail,
		justification: props.justification,
		status: props.status,
		createdAt: props.createdAt,
		updatedAt: props.updatedAt,
		statusHistory: props.statusHistory.map((entry) => ({ ...entry })),
	};
}

export function parseEnrollmentRequestListQuery(params: Readonly<Record<string, string>>): ParseListResult {
	const details: EnrollmentFieldError[] = [];
	for (const field of Object.keys(params)) {
		if (!allowedFields.some((allowed) => allowed === field)) {
			details.push({ field, message: 'Unknown query parameter.' });
		}
	}

	const statusRaw = readParam(params, 'status');
	const courseIdRaw = readParam(params, 'courseId');
	const learnerEmailRaw = readParam(params, 'learnerEmail');

	let status: EnrollmentRequestStatus | undefined;
	if (statusRaw !== undefined) {
		if (!isEnrollmentStatus(statusRaw)) {
			details.push({ field: 'status', message: 'status must be one of pending, approved, rejected, cancelled.' });
		} else {
			status = statusRaw;
		}
	}

	let courseId: string | undefined;
	if (courseIdRaw !== undefined) {
		if (courseIdRaw.trim() === '') {
			details.push({ field: 'courseId', message: 'courseId must be a non-empty string.' });
		} else {
			courseId = courseIdRaw;
		}
	}

	let learnerEmail: string | undefined;
	if (learnerEmailRaw !== undefined) {
		if (learnerEmailRaw.trim() === '') {
			details.push({ field: 'learnerEmail', message: 'learnerEmail must be a non-empty string.' });
		} else {
			learnerEmail = learnerEmailRaw;
		}
	}

	if (details.length > 0) {
		return { ok: false, details };
	}

	const query: EnrollmentRequestListQuery = {
		...(status !== undefined ? { status } : {}),
		...(courseId !== undefined ? { courseId } : {}),
		...(learnerEmail !== undefined ? { learnerEmail } : {}),
	};
	return { ok: true, query };
}

function matches(props: EnrollmentRequestProps, query: EnrollmentRequestListQuery): boolean {
	if (query.status !== undefined && props.status !== query.status) {
		return false;
	}
	if (query.courseId !== undefined && props.courseId !== query.courseId) {
		return false;
	}
	if (query.learnerEmail !== undefined && props.learnerEmail.toLowerCase() !== query.learnerEmail.toLowerCase()) {
		return false;
	}
	return true;
}

export const queryEnrollmentRequests =
	(dataSources: DataSources) =>
	async (query: EnrollmentRequestListQuery): Promise<EnrollmentRequestItem[]> => {
		const requests = await dataSources.readonlyDataSource.enrollmentRequest.list();
		return requests.filter((request) => matches(request.props, query)).map((request) => toEnrollmentRequestItem(request.props));
	};

export const getEnrollmentRequest =
	(dataSources: DataSources) =>
	async (id: string): Promise<EnrollmentRequestItem> => {
		try {
			const request = await dataSources.readonlyDataSource.enrollmentRequest.get(id);
			return toEnrollmentRequestItem(request.props);
		} catch (error) {
			if (error instanceof Error && error.name === 'NotFoundError') {
				throw new EnrollmentRequestError('ENROLLMENT_REQUEST_NOT_FOUND', 404, [{ field: 'id', message: 'Enrollment request was not found.' }]);
			}
			throw error;
		}
	};
