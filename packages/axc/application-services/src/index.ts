import { COURSE_SEED } from './course-seed.ts';
import { type CourseSearchParams, type CourseSearchResult, searchCourses } from './courses.ts';
import { createEnrollmentRequestService, type EnrollmentRequestService } from './enrollment-requests.ts';

export { COURSE_SEED } from './course-seed.ts';
export type { Course, CourseModality, CoursePage, CourseSearchParams, CourseSearchResult, CourseSort, CourseStatus, QueryParameterError } from './courses.ts';
export { searchCourses } from './courses.ts';
export type {
	EnrollmentError,
	EnrollmentErrorCode,
	EnrollmentListParams,
	EnrollmentRequest,
	EnrollmentRequestService,
	EnrollmentRequestStatus,
	EnrollmentResult,
	StatusHistoryEntry,
} from './enrollment-requests.ts';
export { createEnrollmentRequestService } from './enrollment-requests.ts';

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
		search(params: CourseSearchParams): CourseSearchResult;
	};
	enrollmentRequests: EnrollmentRequestService;
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

export function buildApplicationServicesFactory(context: ApiContext): ApplicationServicesFactory {
	// One store per factory so enrollment requests survive across requests (in-memory, per process).
	const enrollmentRequests = createEnrollmentRequestService(COURSE_SEED);
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
				search: (params: CourseSearchParams): CourseSearchResult => searchCourses(COURSE_SEED, params),
			},
			enrollmentRequests,
		});

	return { forRequest };
}
