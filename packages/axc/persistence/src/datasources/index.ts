import type { EnrollmentRequestRecord } from '@axc/data-sources-mongoose-models';
import { domainDataSource } from './domain/index.ts';
import { courseFixtures } from './fixtures/courses.ts';
import { readonlyDataSource } from './readonly/index.ts';
export const buildDataSources = () => {
	const requests = new Map<string, EnrollmentRequestRecord>();
	const courses = structuredClone(courseFixtures);
	return { readonlyDataSource: readonlyDataSource(courses, requests), domainDataSource: domainDataSource(requests) };
};
export type DataSources = ReturnType<typeof buildDataSources>;
