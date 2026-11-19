import type { CourseEntityReference } from '@axc/domain';
import type { DataSources } from './data-sources.ts';

export interface CourseQueryByIdCommand {
	id: string;
}

export const queryById = (dataSources: DataSources) => {
	return async (command: CourseQueryByIdCommand): Promise<CourseEntityReference | null> => {
		return await dataSources.readonlyDataSource.Types.Course.CourseReadRepo.getById(command.id);
	};
};
