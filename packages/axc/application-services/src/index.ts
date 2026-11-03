import { type CoursePage, type CourseQueryErrorBody, type CourseQueryInput, parseCourseQuery, searchCourses } from '@axc/domain';
import { courseCatalog } from './course-catalog.ts';

export type { CourseQueryErrorBody, CourseQueryInput } from '@axc/domain';

export type CourseSearchResult = { ok: true; page: CoursePage } | { ok: false; error: CourseQueryErrorBody };

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
		search(input: CourseQueryInput): CourseSearchResult;
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
			courses: {
				search(input: CourseQueryInput): CourseSearchResult {
					const parsed = parseCourseQuery(input);
					if (!parsed.ok) {
						return parsed;
					}
					return { ok: true, page: searchCourses(courseCatalog, parsed.query) };
				},
			},
		});

	return { forRequest };
}
