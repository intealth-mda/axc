import { createInMemoryEnrollmentRequestStore, createSeededCourseCatalog } from '@axc/persistence';
import { createEnrollmentRequestService, type EnrollmentCommandResult, type EnrollmentListResult, type RawEnrollmentQuery } from './enrollment-requests.ts';
import { type CourseSearchOutcome, type RawCourseQuery, searchCourses } from './search-courses.ts';

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
		search(rawQuery: RawCourseQuery): Promise<CourseSearchOutcome>;
	};
	enrollmentRequests: {
		create(body: unknown): Promise<EnrollmentCommandResult>;
		getById(id: string): Promise<EnrollmentCommandResult>;
		list(rawQuery: RawEnrollmentQuery): Promise<EnrollmentListResult>;
		updateStatus(id: string, body: unknown): Promise<EnrollmentCommandResult>;
	};
}

export type {
	EnrollmentCommandResult,
	EnrollmentErrorBody,
	EnrollmentErrorCode,
	EnrollmentFieldError,
	EnrollmentListResult,
	EnrollmentRequestDto,
	EnrollmentRequestListDto,
	EnrollmentRequestService,
	RawEnrollmentQuery,
	StatusHistoryEntryDto,
} from './enrollment-requests.ts';
export { createEnrollmentRequestService } from './enrollment-requests.ts';
export type { CourseListItem, CourseQueryErrorBody, CourseQueryFieldError, CourseSearchOutcome, CourseSearchPage, RawCourseQuery } from './search-courses.ts';

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

export function buildApplicationServicesFactory(context: ApiContext): ApplicationServicesFactory {
	const courseCatalog = createSeededCourseCatalog();
	const enrollmentRequests = createEnrollmentRequestService({
		catalog: courseCatalog,
		store: createInMemoryEnrollmentRequestStore(),
	});
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
				search(rawQuery: RawCourseQuery): Promise<CourseSearchOutcome> {
					return searchCourses(courseCatalog, rawQuery);
				},
			},
			enrollmentRequests,
		});

	return { forRequest };
}
