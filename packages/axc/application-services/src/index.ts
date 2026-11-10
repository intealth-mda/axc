import { InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from '@axc/persistence';
import { courseService } from './courses.ts';
import { enrollmentRequestService } from './enrollment-requests.ts';

export type { CoursePage, CourseSearchQuery } from './courses.ts';
export type { ChangeEnrollmentStatusCommand, CreateEnrollmentRequestCommand, EnrollmentRequestQuery } from './enrollment-requests.ts';
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
	courses: ReturnType<typeof courseService>;
	enrollmentRequests: ReturnType<typeof enrollmentRequestService>;
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
	const courses = courseService(courseRepository);
	const enrollmentRequests = enrollmentRequestService(new InMemoryEnrollmentRequestRepository(), courseRepository);
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
			courses,
			enrollmentRequests,
		});

	return { forRequest };
}
