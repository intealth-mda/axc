import { InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from '@axc/persistence';
import { type CoursePage, searchCourses } from './courses.ts';
import { type EnrollmentRequestsService, enrollmentRequestsService } from './enrollment-requests.ts';

export type { CoursePage } from './courses.ts';
export type { EnrollmentRequestsService } from './enrollment-requests.ts';
export { type ErrorDetail, ServiceError, type ServiceErrorCode } from './service-error.ts';

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
		search(query: Record<string, string>): Promise<CoursePage>;
	};
	enrollmentRequests: EnrollmentRequestsService;
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
	const courseRepository = new InMemoryCourseRepository();
	const enrollmentRequests = enrollmentRequestsService(courseRepository, new InMemoryEnrollmentRequestRepository());
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
			courses: { search: (query) => searchCourses(courseRepository, query) },
			enrollmentRequests,
		});

	return { forRequest };
}
