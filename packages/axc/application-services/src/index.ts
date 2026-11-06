import type { CourseCatalog, EnrollmentRequestStore } from '@axc/domain';
import { type CourseQueryInput, type SearchCoursesResult, searchCourses } from './courses.ts';
import { createEnrollmentRequest, type EnrollmentCommandResult, type EnrollmentListResult, type EnrollmentQueryInput, getEnrollmentRequest, listEnrollmentRequests, updateEnrollmentRequestStatus } from './enrollment-requests.ts';

export const HEALTH_SERVICE_NAME = 'agentCourses-api' as const;
export const HEALTH_PROJECT_CODE = 'axc' as const;

export type HealthEnvironment = 'local' | 'test' | 'production';

export interface HealthStatus {
	status: 'ok';
	service: typeof HEALTH_SERVICE_NAME;
	projectCode: typeof HEALTH_PROJECT_CODE;
	environment: HealthEnvironment;
	timestamp: string;
}

export interface ApiContext {
	environment: HealthEnvironment;
}

export interface ApplicationServices {
	health: {
		getStatus(): HealthStatus;
	};
	courses: {
		search(query: CourseQueryInput): Promise<SearchCoursesResult>;
	};
	enrollmentRequests: {
		create(body: unknown): Promise<EnrollmentCommandResult>;
		getById(id: string): Promise<EnrollmentCommandResult>;
		list(query: EnrollmentQueryInput): Promise<EnrollmentListResult>;
		updateStatus(id: string, body: unknown): Promise<EnrollmentCommandResult>;
	};
}

export interface ApplicationServicesOptions {
	readonly now?: () => string;
}

export interface ApplicationServicesFactory {
	forRequest(rawAuthHeader?: string): Promise<ApplicationServices>;
}

export function resolveEnvironment(nodeEnv: string | undefined): HealthEnvironment {
	if (nodeEnv === 'production') {
		return 'production';
	}
	if (nodeEnv === 'test') {
		return 'test';
	}
	return 'local';
}

export function buildApplicationServicesFactory(context: ApiContext, courseCatalog: CourseCatalog, enrollmentRequestStore: EnrollmentRequestStore, options: ApplicationServicesOptions = {}): ApplicationServicesFactory {
	const now = options.now ?? ((): string => new Date().toISOString());
	const enrollmentDependencies = { courseCatalog, enrollmentRequests: enrollmentRequestStore, now };
	const forRequest = (): Promise<ApplicationServices> =>
		Promise.resolve({
			health: {
				getStatus(): HealthStatus {
					return {
						status: 'ok',
						service: HEALTH_SERVICE_NAME,
						projectCode: HEALTH_PROJECT_CODE,
						environment: context.environment,
						timestamp: new Date().toISOString(),
					};
				},
			},
			courses: {
				search(query: CourseQueryInput): Promise<SearchCoursesResult> {
					return searchCourses(courseCatalog, query);
				},
			},
			enrollmentRequests: {
				create(body: unknown): Promise<EnrollmentCommandResult> {
					return createEnrollmentRequest(enrollmentDependencies, body);
				},
				getById(id: string): Promise<EnrollmentCommandResult> {
					return getEnrollmentRequest(enrollmentDependencies, id);
				},
				list(query: EnrollmentQueryInput): Promise<EnrollmentListResult> {
					return listEnrollmentRequests(enrollmentDependencies, query);
				},
				updateStatus(id: string, body: unknown): Promise<EnrollmentCommandResult> {
					return updateEnrollmentRequestStatus(enrollmentDependencies, id, body);
				},
			},
		});

	return { forRequest };
}

export type { CourseListItem, CourseListPage, CourseQueryErrorBody, CourseQueryErrorDetail, CourseQueryInput, SearchCoursesResult } from './courses.ts';
export type { EnrollmentCommandResult, EnrollmentErrorBody, EnrollmentErrorCode, EnrollmentErrorDetail, EnrollmentListResult, EnrollmentQueryInput, EnrollmentRequestDto, EnrollmentRequestList } from './enrollment-requests.ts';
export { unreadableEnrollmentRequestBody } from './enrollment-requests.ts';
