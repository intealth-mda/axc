import type { CourseEntityReference } from '@axc/domain';
import { WorkflowError } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
export interface CourseSearchQuery {
	q?: string;
	modality?: string;
	status?: string;
	tag?: string;
	page?: string | number;
	pageSize?: string | number;
	sort?: string;
}
export interface CoursePage {
	items: CourseEntityReference[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}
export const search =
	(dataSources: DataSources) =>
	async (query: CourseSearchQuery): Promise<CoursePage> => {
		const invalid = (field: string): never => {
			throw new WorkflowError('INVALID_QUERY_PARAMETER', `${field} is invalid.`, field);
		};
		if (!query || typeof query !== 'object' || Array.isArray(query)) invalid('query');
		const allowed = ['q', 'modality', 'status', 'tag', 'page', 'pageSize', 'sort'];
		for (const key of Object.keys(query)) if (!allowed.includes(key)) invalid(key);
		const text = (value: unknown, field: string): string | undefined => {
			if (value === undefined) return undefined;
			if (typeof value !== 'string' || !value.trim()) return invalid(field);
			return value.trim();
		};
		const integer = (value: unknown, fallback: number, field: string, max: number): number => {
			if (value === undefined) return fallback;
			if (!(typeof value === 'number' || (typeof value === 'string' && /^[1-9]\d*$/.test(value)))) return invalid(field);
			const number = Number(value);
			if (!Number.isSafeInteger(number) || number < 1 || number > max) return invalid(field);
			return number;
		};
		const q = text(query.q, 'q');
		const tag = text(query.tag, 'tag');
		const modality = text(query.modality, 'modality');
		const status = text(query.status, 'status');
		const sort = text(query.sort, 'sort') ?? 'title';
		if (modality && !['online', 'in-person', 'hybrid'].includes(modality)) invalid('modality');
		if (status && !['draft', 'active', 'retired'].includes(status)) invalid('status');
		if (sort !== 'title' && sort !== 'createdAt' && sort !== 'updatedAt') return invalid('sort');
		return await dataSources.readonlyDataSource.Training.Course.CourseReadRepo.search({
			...(q === undefined ? {} : { q }),
			...(tag === undefined ? {} : { tag }),
			...(modality === undefined ? {} : { modality }),
			...(status === undefined ? {} : { status }),
			page: integer(query.page, 1, 'page', Number.MAX_SAFE_INTEGER),
			pageSize: integer(query.pageSize, 10, 'pageSize', 50),
			sort,
		});
	};
