import type { CatalogDependencies, CourseSearchQuery, EnrollmentListQuery } from './catalog.ts';
import { createEnrollmentRequest, getEnrollmentRequest, listEnrollmentRequests, searchCourses, updateEnrollmentStatus } from './catalog.ts';

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
		search(query: CourseSearchQuery): ReturnType<typeof searchCourses>;
	};
	enrollmentRequests: {
		create(body: unknown): ReturnType<typeof createEnrollmentRequest>;
		getById(id: string): ReturnType<typeof getEnrollmentRequest>;
		list(query: EnrollmentListQuery): ReturnType<typeof listEnrollmentRequests>;
		updateStatus(id: string, body: unknown): ReturnType<typeof updateEnrollmentStatus>;
	};
}

export interface ApplicationServicesFactory {
	forRequest(rawAuthHeader?: string): Promise<ApplicationServices>;
}

export type { CatalogDependencies, ServiceError, ServiceErrorDetail, ServiceResult } from './catalog.ts';

export function resolveEnvironment(nodeEnv: string | undefined): HealthEnvironment {
	if (nodeEnv === 'production') {
		return 'production';
	}
	if (nodeEnv === 'test') {
		return 'test';
	}
	return 'local';
}

export function buildApplicationServicesFactory(context: ApiContext, catalog: CatalogDependencies): ApplicationServicesFactory {
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
					return searchCourses(catalog, query);
				},
			},
			enrollmentRequests: {
				create(body) {
					return createEnrollmentRequest(catalog, body);
				},
				getById(id) {
					return getEnrollmentRequest(catalog, id);
				},
				list(query) {
					return listEnrollmentRequests(catalog, query);
				},
				updateStatus(id, body) {
					return updateEnrollmentStatus(catalog, id, body);
				},
			},
		});

	return { forRequest };
}
