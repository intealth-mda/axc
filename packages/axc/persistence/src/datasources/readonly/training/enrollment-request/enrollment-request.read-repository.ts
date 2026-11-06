import type { EnrollmentRequestEntityReference } from '@axc/domain';
import type { MemoryStore } from '../../../store.ts';
export interface EnrollmentRequestReadRepository {
	getById(id: string): Promise<EnrollmentRequestEntityReference | null>;
	list(): Promise<EnrollmentRequestEntityReference[]>;
}
export const getEnrollmentRequestReadRepository = (store: MemoryStore): EnrollmentRequestReadRepository => ({
	getById: (id) => Promise.resolve(structuredClone(store.requests.get(id) ?? null)),
	list: () => Promise.resolve(structuredClone([...store.requests.values()])),
});
