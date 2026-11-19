import { createCourseCatalogDataSources, type DataSources } from './course/data-sources.ts';
import { Course as CourseApi, type CourseApplicationService } from './course/index.ts';

export interface TypesContextApplicationService {
	Course: CourseApplicationService;
}

export const Types = (dataSources: DataSources = createCourseCatalogDataSources()): TypesContextApplicationService => {
	return {
		Course: CourseApi(dataSources),
	};
};
