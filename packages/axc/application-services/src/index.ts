import { createCourseCatalogDataSources } from './contexts/types/course/data-sources.ts';
import { Types, type TypesContextApplicationService } from './contexts/types/index.ts';

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
	types: TypesContextApplicationService;
}

export type { CourseListItem, CoursePage, CourseSearchCommand, CourseSort } from './contexts/types/course/search.ts';
export type { CreateEnrollmentRequestCommand } from './contexts/types/enrollment-request/create.ts';
export { EnrollmentRequestFailure } from './contexts/types/enrollment-request/errors.ts';
export type { EnrollmentRequestItem, StatusHistoryItem } from './contexts/types/enrollment-request/item.ts';
export type { EnrollmentRequestList, EnrollmentRequestQueryCommand } from './contexts/types/enrollment-request/query.ts';
export type { UpdateEnrollmentRequestStatusCommand } from './contexts/types/enrollment-request/update-status.ts';

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
	const types = Types(createCourseCatalogDataSources());
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
			types,
		});

	return { forRequest };
}
