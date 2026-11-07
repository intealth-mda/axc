import type { DataSources } from '@axc/persistence';
import { Catalog, type CatalogContextApplicationService } from './contexts/catalog/index.ts';
import { Enrollment, type EnrollmentContextApplicationService } from './contexts/enrollment/index.ts';

export type { CourseSearchQuery } from './contexts/catalog/course/index.ts';
export type { ChangeStatusCommand, CreateEnrollmentRequestCommand, EnrollmentRequestFilters } from './contexts/enrollment/enrollment-request/index.ts';
export { ApplicationError } from './contexts/errors.ts';
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
	dataSourcesFactory: () => DataSources;
}

export interface ApplicationServices {
	health: {
		getStatus(): HealthStatus;
	};
	Catalog: CatalogContextApplicationService;
	Enrollment: EnrollmentContextApplicationService;
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
	const dataSources = context.dataSourcesFactory();
	const forRequest = (): Promise<ApplicationServices> =>
		Promise.resolve({
			Catalog: Catalog(dataSources),
			Enrollment: Enrollment(dataSources),
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
		});

	return { forRequest };
}
