import type { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';

export interface CourseQueryByIdCommand {
	id: string;
}

export const queryById = (dataSources: DataSources) => {
	return async (command: CourseQueryByIdCommand): Promise<Domain.Contexts.Catalog.Course.CourseEntityReference | null> => {
		return await dataSources.readonlyDataSource.Catalog.Course.CourseReadRepo.getById(command.id);
	};
};
