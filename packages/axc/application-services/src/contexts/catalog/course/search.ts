import type { Catalog } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { ApplicationError } from '../../errors.ts';
export interface CourseSearchQuery {
	q?: string | undefined;
	modality?: string | undefined;
	status?: string | undefined;
	tag?: string | undefined;
	page?: number | undefined;
	pageSize?: number | undefined;
	sort?: string | undefined;
}
export const search =
	(dataSources: DataSources): ((query: CourseSearchQuery) => Promise<{ items: Catalog.CourseEntityReference[]; page: number; pageSize: number; totalItems: number; totalPages: number }>) =>
	async (query: CourseSearchQuery) => {
		const details: { field: string; message: string }[] = [];
		if (query.modality !== undefined && !['online', 'in-person', 'hybrid'].includes(query.modality)) details.push({ field: 'modality', message: 'modality must be online, in-person, or hybrid.' });
		if (query.status !== undefined && !['draft', 'active', 'retired'].includes(query.status)) details.push({ field: 'status', message: 'status must be draft, active, or retired.' });
		if (query.page !== undefined && (!Number.isInteger(query.page) || query.page < 1)) details.push({ field: 'page', message: 'page must be a positive integer.' });
		if (query.pageSize !== undefined && (!Number.isInteger(query.pageSize) || query.pageSize < 1 || query.pageSize > 50)) details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		if (query.sort !== undefined && !['title', 'createdAt', 'updatedAt'].includes(query.sort)) details.push({ field: 'sort', message: 'sort must be title, createdAt, or updatedAt.' });
		if (details.length) throw new ApplicationError('INVALID_QUERY_PARAMETER', details);
		return await dataSources.readonlyDataSource.Catalog.Course.CourseReadRepo.search({ ...query, page: query.page ?? 1, pageSize: query.pageSize ?? 10, sort: (query.sort ?? 'title') as 'title' | 'createdAt' | 'updatedAt' });
	};
