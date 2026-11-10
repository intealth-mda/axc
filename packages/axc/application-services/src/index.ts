import { createDataSources } from '@axc/persistence';
import { Course, type CourseApplicationService } from './contexts/catalog/course/index.ts';

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
}

export interface ApplicationServicesFactory {
	forRequest(rawAuthHeader?: string): Promise<ApplicationServices>;
}

export type { CourseQueryFieldError, CourseRecord, CourseSearchRawQuery, CourseSearchResult } from './contexts/catalog/course/index.ts';
export { INVALID_COURSE_QUERY_CODE, INVALID_COURSE_QUERY_MESSAGE, InvalidCourseQueryError } from './contexts/catalog/course/index.ts';

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
	const forRequest = (): Promise<ApplicationServices> => {
		const dataSources = createDataSources();
		return Promise.resolve({
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
			course: Course(dataSources),
		});
	};

	return { forRequest };
}
