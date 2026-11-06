import type { CourseEntityReference } from '@axc/domain';
import type { MemoryStore } from '../../../store.ts';
export interface CourseReadRepository {
	getById(id: string): Promise<CourseEntityReference | null>;
	list(): Promise<CourseEntityReference[]>;
}
export const getCourseReadRepository = (store: MemoryStore): CourseReadRepository => ({
	getById: (id) => Promise.resolve(structuredClone(store.courses.get(id) ?? null)),
	list: () => Promise.resolve(structuredClone([...store.courses.values()])),
});
