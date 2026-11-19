import { createCourseCatalogDataSources, type DataSources } from './course/data-sources.ts';
import { Course as CourseApi, type CourseApplicationService } from './course/index.ts';
import { EnrollmentRequest as EnrollmentRequestApi, type EnrollmentRequestApplicationService } from './enrollment-request/index.ts';

export interface TypesContextApplicationService {
	Course: CourseApplicationService;
	EnrollmentRequest: EnrollmentRequestApplicationService;
}

export const Types = (dataSources: DataSources = createCourseCatalogDataSources()): TypesContextApplicationService => {
	return {
		Course: CourseApi(dataSources),
		EnrollmentRequest: EnrollmentRequestApi(dataSources),
	};
};
