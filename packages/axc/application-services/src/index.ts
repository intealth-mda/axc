import type { CourseRepository, EnrollmentRequest, EnrollmentRequestRepository } from '@axc/domain';
import { type CoursePage, searchCourses } from './courses.ts';
import { createEnrollmentRequest, getEnrollmentRequest, listEnrollmentRequests, updateEnrollmentRequestStatus } from './enrollment-requests.ts';

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

export interface ApplicationDependencies {
	courses: CourseRepository;
	enrollmentRequests: EnrollmentRequestRepository;
	now?: () => string;
	createId?: () => string;
}

export interface ApplicationServices {
	health: {
		getStatus(): HealthStatus;
	};
	courses: {
		search(query: Readonly<Record<string, string | undefined>>): Promise<CoursePage>;
	};
	enrollmentRequests: {
		create(input: unknown): Promise<EnrollmentRequest>;
		get(id: string): Promise<EnrollmentRequest>;
		list(query: Readonly<Record<string, string | undefined>>): Promise<{ items: EnrollmentRequest[] }>;
		updateStatus(id: string, input: unknown): Promise<EnrollmentRequest>;
	};
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

export function buildApplicationServicesFactory(context: ApiContext, dependencies: ApplicationDependencies): ApplicationServicesFactory {
	const now = dependencies.now ?? (() => new Date().toISOString());
	const createId = dependencies.createId ?? (() => crypto.randomUUID());
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
				search(query) {
					return searchCourses(dependencies.courses, query);
				},
			},
			enrollmentRequests: {
				create(input) {
					return createEnrollmentRequest(dependencies.courses, dependencies.enrollmentRequests, now, createId, input);
				},
				get(id) {
					return getEnrollmentRequest(dependencies.enrollmentRequests, id);
				},
				list(query) {
					return listEnrollmentRequests(dependencies.enrollmentRequests, query);
				},
				updateStatus(id, input) {
					return updateEnrollmentRequestStatus(dependencies.enrollmentRequests, now, id, input);
				},
			},
		});

	return { forRequest };
}

export type { CoursePage } from './courses.ts';
export { ApplicationError, type ApplicationErrorCode, applicationErrorStatus, type ErrorDetail } from './errors.ts';
