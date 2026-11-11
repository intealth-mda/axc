import { getDataSources } from '@axc/persistence';
import { Course, type CourseApplicationService } from './contexts/catalog/course/index.ts';
import { EnrollmentRequest, type EnrollmentRequestApplicationService } from './contexts/catalog/enrollment-request/index.ts';

export type { CourseItem, CoursePage, CourseQueryFieldError, CourseSearchQuery } from './contexts/catalog/course/query-courses.ts';
export { parseCourseSearchQuery } from './contexts/catalog/course/query-courses.ts';
export { EnrollmentRequestError } from './contexts/catalog/enrollment-request/create.ts';
export { type EnrollmentFieldError, type EnrollmentRequestListQuery, parseEnrollmentRequestListQuery } from './contexts/catalog/enrollment-request/query-enrollment-requests.ts';

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
	course: CourseApplicationService;
	enrollmentRequest: EnrollmentRequestApplicationService;
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
			course: Course(getDataSources()),
			enrollmentRequest: EnrollmentRequest(getDataSources()),
		});

	return { forRequest };
}
