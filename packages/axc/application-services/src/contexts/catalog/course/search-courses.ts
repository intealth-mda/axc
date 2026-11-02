import type { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';

export interface CourseSearchCoursesCommand {
	q?: string;
	modality?: 'online' | 'in-person' | 'hybrid';
	status?: 'draft' | 'active' | 'retired';
	tag?: string;
	page?: number;
	pageSize?: number;
	sort?: 'title' | 'createdAt' | 'updatedAt';
}

export const searchCourses = (dataSources: DataSources) => {
	return async (command: CourseSearchCoursesCommand): Promise<Domain.Contexts.Catalog.Course.CourseEntityReference[]> => {
		return await dataSources.readonlyDataSource.Catalog.Course.CourseReadRepo.searchCourses(command);
	};
};
