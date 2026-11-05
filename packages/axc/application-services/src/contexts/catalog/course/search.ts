import type { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';

export interface CourseSearchCommand {
	q?: string;
	modality?: 'online' | 'in-person' | 'hybrid';
	status?: 'draft' | 'active' | 'retired';
	tag?: string;
	page?: number;
	pageSize?: number;
	sort?: 'title' | 'createdAt' | 'updatedAt';
}

export const search = (dataSources: DataSources) => {
	return async (command: CourseSearchCommand): Promise<Domain.Contexts.Catalog.Course.CourseEntityReference[]> => {
		return await dataSources.readonlyDataSource.Catalog.Course.CourseReadRepo.search(command.q, command.modality, command.status, command.tag, command.page, command.pageSize, command.sort);
	};
};
