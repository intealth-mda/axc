import type { CatalogResult, CourseSearchResult, EnrollmentRequest, RawQuery } from '@axc/domain';
import { type ApplicationCatalog, createCatalogServices } from './catalog.ts';

export type { ApplicationCatalog } from './catalog.ts';

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
		search(query: RawQuery): Promise<CatalogResult<CourseSearchResult>>;
	};
	enrollmentRequests: {
		create(body: unknown): Promise<CatalogResult<EnrollmentRequest>>;
		getById(id: string): Promise<CatalogResult<EnrollmentRequest>>;
		list(query: RawQuery): Promise<CatalogResult<EnrollmentRequest[]>>;
		updateStatus(id: string, body: unknown): Promise<CatalogResult<EnrollmentRequest>>;
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

export function buildApplicationServicesFactory(context: ApiContext, catalog?: ApplicationCatalog): ApplicationServicesFactory {
	const catalogServices = createCatalogServices(catalog);
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
			...catalogServices,
		});

	return { forRequest };
}
